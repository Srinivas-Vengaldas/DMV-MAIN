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

    let session: { userId: string; email: string; role?: string };
    try {
      session = verifySession(token);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const { locationId, locationName, locationAddress, appointmentDate, timeLabel } = body ?? {};

    if (!locationId || !locationName || !locationAddress || !appointmentDate || !timeLabel) {
      return NextResponse.json(
        { error: "locationId, locationName, locationAddress, appointmentDate, and timeLabel are required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(appointmentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid appointmentDate" }, { status: 400 });
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
        caseNumber: true,
      },
    });

    if (!approvedVerification) {
      return NextResponse.json(
        { error: "Document verification required before booking an appointment" },
        { status: 403 }
      );
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: session.userId,
        status: "SCHEDULED",
      },
      orderBy: {
        bookedAt: "desc",
      },
      select: {
        id: true,
        appointmentDate: true,
        timeLabel: true,
        locationName: true,
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        {
          error: "You already have a scheduled appointment",
          appointment: {
            id: existingAppointment.id,
            appointmentDate: existingAppointment.appointmentDate.toISOString(),
            timeLabel: existingAppointment.timeLabel,
            locationName: existingAppointment.locationName,
          },
        },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.userId,
        verificationId: approvedVerification.id,
        locationId,
        locationName,
        locationAddress,
        appointmentDate: parsedDate,
        timeLabel,
        status: "SCHEDULED",
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
      },
    });

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
      },
    });
  } catch (error) {
    console.error("POST /api/appointment/book error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}