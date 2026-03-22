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

    const activities = await prisma.staffActivity.findMany({
      where: {
        staffId: session.userId,
      },
      include: {
        verification: {
          include: {
            user: true,
          },
        },
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      activities: activities.map((item) => ({
        id: item.id,
        caseNumber: item.verification.caseNumber ?? "",
        staffId: item.staffId,
        staffName: `${item.staff.firstName} ${item.staff.lastName}`,
        action: item.action.toLowerCase(),
        verificationId: item.verificationId,
        documentType: item.verification.documentType,
        userName: `${item.verification.user.firstName} ${item.verification.user.lastName}`,
        timestamp: item.createdAt.toISOString(),
        notes: item.notes ?? "",
      })),
    });
  } catch (error) {
    console.error("GET /api/staff/activity error:", error);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 }
    );
  }
}