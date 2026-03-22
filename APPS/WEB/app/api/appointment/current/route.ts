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

    let session: { userId: string; email: string; role?: string };
    try {
      session = verifySession(token);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        userId: session.userId,
        status: "SCHEDULED",
      },
      orderBy: {
        bookedAt: "desc",
      },
      select: {
        id: true,
        userId: true,
        verificationId: true,
        locationId: true,
        locationName: true,
        locationAddress: true,
        appointmentDate: true,
        timeLabel: true,
        status: true,
        bookedAt: true,
        completedAt: true,
        cancelledAt: true,
        staffId: true,
        staffName: true,
        verification: {
          select: {
            fileName: true,
            caseNumber: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({
        success: true,
        appointment: null,
      });
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        userId: appointment.userId,
        verificationId: appointment.verificationId,
        locationId: appointment.locationId,
        locationName: appointment.locationName,
        locationAddress: appointment.locationAddress,
        appointmentDate: appointment.appointmentDate.toISOString(),
        timeLabel: appointment.timeLabel,
        status: appointment.status.toLowerCase(),
        bookedAt: appointment.bookedAt.toISOString(),
        completedAt: appointment.completedAt?.toISOString() ?? null,
        cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
        staffId: appointment.staffId ?? null,
        staffName: appointment.staffName ?? null,
        documentFileName: appointment.verification?.fileName ?? "",
        caseNumber: appointment.verification?.caseNumber ?? "",
      },
    });
  } catch (error) {
    console.error("GET /api/appointment/current error:", error);
    return NextResponse.json(
      { error: "Failed to load current appointment" },
      { status: 500 }
    );
  }
}