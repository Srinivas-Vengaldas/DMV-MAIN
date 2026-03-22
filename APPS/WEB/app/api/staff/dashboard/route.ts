import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      pendingCount,
      staffReviewCount,
      lowConfidenceCount,
      reviewedToday,
      recentPending,
      recentActivity,
    ] = await Promise.all([
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
          aiConfidence: {
            lt: 0.7,
          },
        },
      }),

      prisma.staffActivity.count({
        where: {
          staffId: session.userId,
          createdAt: {
            gte: todayStart,
          },
        },
      }),

      prisma.documentVerification.findMany({
        where: {
          status: "PENDING",
          isActive: true,
        },
        include: {
          user: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
        take: 5,
      }),

      prisma.staffActivity.findMany({
        where: {
          staffId: session.userId,
        },
        include: {
          verification: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      dashboard: {
        counts: {
          pending: pendingCount,
          staffReview: staffReviewCount,
          lowConfidence: lowConfidenceCount,
          reviewedToday,
        },
        recentPending: recentPending.map((item) => ({
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
        })),
        recentActivity: recentActivity.map((item) => ({
          id: item.id,
          staffId: item.staffId,
          action: item.action.toLowerCase(),
          verificationId: item.verificationId,
          caseNumber: item.verification.caseNumber ?? "",
          documentType: item.verification.documentType,
          userName: `${item.verification.user.firstName} ${item.verification.user.lastName}`,
          timestamp: item.createdAt.toISOString(),
          notes: item.notes ?? "",
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/staff/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load staff dashboard" },
      { status: 500 }
    );
  }
}