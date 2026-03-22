import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function escalateResidentTimedOutVerification(userId: string) {
  const latestPending = await prisma.documentVerification.findFirst({
    where: {
      userId,
      isActive: true,
      status: "PENDING",
      aiStatus: "PENDING",
      isStaffReview: false,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  if (!latestPending) return;

  const isTimedOut =
    Date.now() - new Date(latestPending.submittedAt).getTime() >= 60 * 1000;

  if (!isTimedOut) return;

  await prisma.documentVerification.update({
    where: { id: latestPending.id },
    data: {
      isStaffReview: true,
      aiStatus: "TIMED_OUT",
      sentToStaffAt: new Date(),
    },
  });
}

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

    await escalateResidentTimedOutVerification(session.userId);

    const verification = await prisma.documentVerification.findFirst({
      where: {
        userId: session.userId,
        isActive: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json({
        success: true,
        verification: null,
      });
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        documentType: verification.documentType,
        fileName: verification.fileName,
        status: verification.status,
        aiStatus: verification.aiStatus,
        isStaffReview: verification.isStaffReview,
        aiConfidence: verification.aiConfidence,
        ocrText: verification.ocrText,
        extractedFields: verification.extractedFields,
        submittedAt: verification.submittedAt.toISOString(),
        sentToStaffAt: verification.sentToStaffAt?.toISOString() ?? null,
        reviewedAt: verification.reviewedAt?.toISOString() ?? null,
        reviewNotes: verification.reviewNotes ?? "",
      },
    });
  } catch (error) {
    console.error("GET /api/verification/me error:", error);
    return NextResponse.json(
      { error: "Failed to load verification status" },
      { status: 500 }
    );
  }
}