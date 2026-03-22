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

    const { verificationId, decision, notes } = await req.json();

    if (!verificationId || !decision) {
      return NextResponse.json(
        { error: "verificationId and decision required" },
        { status: 400 }
      );
    }

    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json(
        { error: "decision must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const verification = await tx.documentVerification.update({
        where: { id: verificationId },
        data: {
          status: decision,
          reviewedById: session.userId,
          reviewedAt: new Date(),
          reviewNotes: notes ?? "",
          aiStatus: decision === "APPROVED" ? "APPROVED_BY_STAFF" : "REJECTED_BY_STAFF",
        },
      });

      const activity = await tx.staffActivity.create({
        data: {
          staffId: session.userId,
          verificationId: verification.id,
          action: decision === "APPROVED" ? "APPROVED" : "REJECTED",
          notes: notes ?? "",
        },
      });
      
      console.log("STAFF ACTIVITY CREATED:", activity.id, activity.action, activity.createdAt);

      return verification;
    });

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (error) {
    console.error("POST /api/staff/verifications/review error:", error);
    return NextResponse.json(
      { error: "Failed to review verification" },
      { status: 500 }
    );
  }
}