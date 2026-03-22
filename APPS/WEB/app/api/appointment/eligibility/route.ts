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

    const approvedVerification = await prisma.documentVerification.findFirst({
      where: {
        userId: session.userId,
        status: "APPROVED",
        isActive: true,
      },
      orderBy: {
        reviewedAt: "desc",
      },
      select: {
        id: true,
        fileName: true,
        reviewedAt: true,
        caseNumber: true,
      },
    });

    return NextResponse.json({
      success: true,
      eligible: !!approvedVerification,
      verification: approvedVerification
        ? {
            id: approvedVerification.id,
            fileName: approvedVerification.fileName,
            reviewedAt: approvedVerification.reviewedAt?.toISOString() ?? null,
            caseNumber: approvedVerification.caseNumber ?? "",
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/appointment/eligibility error:", error);
    return NextResponse.json(
      { error: "Failed to check appointment eligibility" },
      { status: 500 }
    );
  }
}