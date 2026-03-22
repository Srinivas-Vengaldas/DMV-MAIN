import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

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

    if (session.role !== "STAFF" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { verificationId, reason } = await req.json();

    if (!verificationId) {
      return NextResponse.json(
        { error: "verificationId is required" },
        { status: 400 }
      );
    }

    const verification = await prisma.documentVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const flagged = await tx.documentVerification.update({
        where: { id: verificationId },
        data: {
          isException: true,
          exceptionReason: reason?.trim() || "Flagged by staff for manual exception review",
          flaggedAt: new Date(),
          flaggedById: session.userId,
        },
      });

      await tx.staffActivity.create({
        data: {
          staffId: session.userId,
          verificationId,
          action: "NOTE_ADDED",
          notes: `Exception flagged: ${reason?.trim() || "No reason provided"}`,
        },
      });

      return flagged;
    });

    return NextResponse.json({
      success: true,
      verification: {
        id: updated.id,
        isException: updated.isException,
        exceptionReason: updated.exceptionReason,
        flaggedAt: updated.flaggedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("POST /api/staff/verifications/flag error:", error);
    return NextResponse.json(
      { error: "Failed to flag verification" },
      { status: 500 }
    );
  }
}