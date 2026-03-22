import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const payload = verifySession(token);
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json(
        {
          hasApplication: false,
          hasDraft: false,
          formSubmitted: false,
          applicationId: null,
          status: null,
          documentStatus: "not_uploaded",
          canScheduleAppointment: false,
          verification: null,
        },
        { status: 200 }
      );
    }

    const [latestApplication, latestVerification] = await Promise.all([
      prisma.application.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          status: true,
        },
      }),

      prisma.documentVerification.findFirst({
        where: {
          userId,
          isActive: true,
        },
        orderBy: [
          { reviewedAt: "desc" },
          { submittedAt: "desc" },
        ],
        select: {
          id: true,
          caseNumber: true,
          fileName: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          isException: true,
          exceptionReason: true,
          isStaffReview: true,
          aiConfidence: true,
        },
      }),
    ]);

    let documentStatus: "not_uploaded" | "pending" | "approved" | "rejected" =
      "not_uploaded";

    if (latestVerification) {
      if (latestVerification.status === "APPROVED") {
        documentStatus = "approved";
      } else if (latestVerification.status === "REJECTED") {
        documentStatus = "rejected";
      } else {
        documentStatus = "pending";
      }
    }

    if (!latestApplication) {
      return NextResponse.json(
        {
          hasApplication: false,
          hasDraft: false,
          formSubmitted: false,
          applicationId: null,
          status: null,
          documentStatus,
          canScheduleAppointment: documentStatus === "approved",
          verification: latestVerification
            ? {
                id: latestVerification.id,
                caseNumber: latestVerification.caseNumber ?? "",
                fileName: latestVerification.fileName,
                status: latestVerification.status.toLowerCase(),
                submittedAt: latestVerification.submittedAt.toISOString(),
                reviewedAt: latestVerification.reviewedAt?.toISOString() ?? null,
                isException: latestVerification.isException,
                exceptionReason: latestVerification.exceptionReason ?? "",
                isStaffReview: latestVerification.isStaffReview,
                aiConfidence: latestVerification.aiConfidence ?? 0,
              }
            : null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hasApplication: true,
        hasDraft: latestApplication.status === "DRAFT",
        formSubmitted: latestApplication.status === "SUBMITTED",
        applicationId: latestApplication.id,
        status: latestApplication.status,
        documentStatus,
        canScheduleAppointment: documentStatus === "approved",
        verification: latestVerification
          ? {
              id: latestVerification.id,
              caseNumber: latestVerification.caseNumber ?? "",
              fileName: latestVerification.fileName,
              status: latestVerification.status.toLowerCase(),
              submittedAt: latestVerification.submittedAt.toISOString(),
              reviewedAt: latestVerification.reviewedAt?.toISOString() ?? null,
              isException: latestVerification.isException,
              exceptionReason: latestVerification.exceptionReason ?? "",
              isStaffReview: latestVerification.isStaffReview,
              aiConfidence: latestVerification.aiConfidence ?? 0,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("application status error:", error);
    return NextResponse.json(
      {
        hasApplication: false,
        hasDraft: false,
        formSubmitted: false,
        applicationId: null,
        status: null,
        documentStatus: "not_uploaded",
        canScheduleAppointment: false,
        verification: null,
      },
      { status: 200 }
    );
  }
}