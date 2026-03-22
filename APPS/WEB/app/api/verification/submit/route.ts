import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function buildCaseNumber(sequence: number) {
  const year = new Date().getFullYear();
  return `CASE-${year}-${String(sequence).padStart(6, "0")}`;
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const {
      documentType,
      fileName,
      fileUrl,
      ocrText,
      extractedFields,
      aiConfidence,
    } = body;

    if (!documentType || !fileName) {
      return NextResponse.json(
        { error: "documentType and fileName are required" },
        { status: 400 }
      );
    }

    const latestApplication = await prisma.application.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    const verification = await prisma.$transaction(async (tx) => {
      await tx.documentVerification.updateMany({
        where: {
          userId: session.userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      const totalCount = await tx.documentVerification.count();
      const caseNumber = buildCaseNumber(totalCount + 1);

      return tx.documentVerification.create({
        data: {
          userId: session.userId,
          applicationId: latestApplication?.id ?? null,
          documentType: String(documentType),
          fileName: String(fileName),
          fileUrl: fileUrl ? String(fileUrl) : null,
          caseNumber,
          status: "PENDING",
          aiStatus: "PENDING",
          isStaffReview: false,
          isActive: true,
          aiConfidence: typeof aiConfidence === "number" ? aiConfidence : null,
          ocrText: ocrText ? String(ocrText) : null,
          extractedFields:
            extractedFields && typeof extractedFields === "object"
              ? extractedFields
              : {},
        },
      });
    });

    return NextResponse.json({
      success: true,
      verification: {
        ...verification,
        submittedAt: verification.submittedAt.toISOString(),
        sentToStaffAt: verification.sentToStaffAt?.toISOString() ?? null,
        reviewedAt: verification.reviewedAt?.toISOString() ?? null,
        createdAt: verification.createdAt.toISOString(),
        updatedAt: verification.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/verification/submit error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create verification record" },
      { status: 500 }
    );
  }
}