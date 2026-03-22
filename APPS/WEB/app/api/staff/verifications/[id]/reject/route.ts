import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes : "";

    const verification = await prisma.documentVerification.update({
      where: { id },
      data: {
        status: "REJECTED",
        aiStatus: "REJECTED_BY_STAFF",
        reviewedAt: new Date(),
        reviewedById: session.userId,
        reviewNotes: notes || null,
        isStaffReview: false,
      },
    });

    await prisma.staffActivity.create({
      data: {
        staffId: session.userId,
        verificationId: verification.id,
        action: "REJECTED",
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error("POST /api/staff/verifications/[id]/reject error:", error);
    return NextResponse.json(
      { error: "Failed to reject verification" },
      { status: 500 }
    );
  }
}