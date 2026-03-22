import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function escalateTimedOutVerifications() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  await prisma.documentVerification.updateMany({
    where: {
      status: "PENDING",
      aiStatus: "PENDING",
      isStaffReview: false,
      isActive: true,
      submittedAt: {
        lte: oneMinuteAgo,
      },
    },
    data: {
      isStaffReview: true,
      aiStatus: "TIMED_OUT",
      sentToStaffAt: new Date(),
    },
  });
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = verifySession(token);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (session.role !== "STAFF" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await escalateTimedOutVerifications();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const q = searchParams.get("q");
    const caseNumber = searchParams.get("case");

    const where: any = {};

    if (caseNumber) {
      where.caseNumber = caseNumber;
    } else if (filter === "reviewed") {
      where.status = {
        in: ["APPROVED", "REJECTED"],
      };
    } else {
      where.status = "PENDING";
      where.isActive = true;

      if (filter === "staff-review") {
        where.isStaffReview = true;
      }

      if (filter === "low-confidence") {
        where.aiConfidence = { lt: 0.7 };
      }
    }

    if (q && q.trim()) {
      where.OR = [
        { documentType: { contains: q, mode: "insensitive" } },
        { fileName: { contains: q, mode: "insensitive" } },
        { caseNumber: { contains: q, mode: "insensitive" } },
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [
      verifications,
      pendingCount,
      staffReviewCount,
      lowConfidenceCount,
      reviewedCount,
    ] = await Promise.all([
      prisma.documentVerification.findMany({
        where,
        include: {
          user: true,
          application: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      }),

      prisma.documentVerification.count({
        where: {
          status: "PENDING",
          isActive: true,
        },
      }),

      prisma.documentVerification.count({
        where: {
          status: "PENDING",
          isActive: true,
          isStaffReview: true,
        },
      }),

      prisma.documentVerification.count({
        where: {
          status: "PENDING",
          isActive: true,
          aiConfidence: { lt: 0.7 },
        },
      }),

      prisma.documentVerification.count({
        where: {
          status: {
            in: ["APPROVED", "REJECTED"],
          },
        },
      }),
    ]);

    const normalized = verifications.map((item) => {
      const formData =
        item.application?.formData &&
        typeof item.application.formData === "object" &&
        !Array.isArray(item.application.formData)
          ? (item.application.formData as Record<string, any>)
          : {};

      const residentInfo = {
        fullName:
          formData.fullName ||
          `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim(),
        firstName: formData.firstName || item.user.firstName || "",
        lastName: formData.lastName || item.user.lastName || "",
        phone: formData.phone || item.user.phone || "",
        address: formData.address || item.user.address || "",
        city: formData.city || item.user.city || "",
        state: formData.state || "",
        zipCode: formData.zipCode || formData.zip || item.user.zip || "",
      };

      return {
        id: item.id,
        caseNumber: item.caseNumber ?? "",
        userId: item.userId,
        userName: `${item.user.firstName} ${item.user.lastName}`,
        userEmail: item.user.email,
        documentType: item.documentType,
        fileName: item.fileName,
        status: item.status.toLowerCase(),
        submittedAt: item.submittedAt.toISOString(),
        aiConfidence: item.aiConfidence ?? 0,
        isStaffReview: item.isStaffReview,
        isException: item.isException,
        exceptionReason: item.exceptionReason ?? "",
        flaggedAt: item.flaggedAt?.toISOString() ?? null,
        flaggedById: item.flaggedById ?? null,
        reviewedBy: item.reviewedById ?? undefined,
        reviewedAt: item.reviewedAt?.toISOString() ?? null,
        notes: item.reviewNotes ?? "",
        aiStatus: item.aiStatus,
        sentToStaffAt: item.sentToStaffAt?.toISOString() ?? null,
        ocrText: item.ocrText ?? "",
        extractedFields: item.extractedFields ?? {},
        residentInfo,
      };
    });

    return NextResponse.json({
      success: true,
      verifications: normalized,
      counts: {
        pending: pendingCount,
        staffReview: staffReviewCount,
        lowConfidence: lowConfidenceCount,
        reviewed: reviewedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/staff/verifications error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load verifications",
      },
      { status: 500 }
    );
  }
}