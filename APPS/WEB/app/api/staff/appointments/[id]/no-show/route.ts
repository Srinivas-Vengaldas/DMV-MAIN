import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function POST(
  _req: Request,
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

    const { id: appointmentId } = await params;

    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const staffUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true },
    });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only scheduled appointments can be marked no-show" },
        { status: 409 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "NO_SHOW",
        staffId: session.userId,
        staffName: staffUser
          ? `${staffUser.firstName} ${staffUser.lastName}`.trim()
          : null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        status: updated.status.toLowerCase(),
        completedAt: updated.completedAt?.toISOString() ?? null,
        staffId: updated.staffId ?? null,
        staffName: updated.staffName ?? null,
      },
    });
  } catch (error) {
    console.error("POST /api/staff/appointments/[id]/no-show error:", error);
    return NextResponse.json(
      { error: "Failed to mark appointment as no-show" },
      { status: 500 }
    );
  }
}