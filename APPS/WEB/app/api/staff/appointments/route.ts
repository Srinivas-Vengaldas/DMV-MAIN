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

    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        verification: {
          select: {
            fileName: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      appointments: appointments.map((item) => ({
        id: item.id,
        userId: item.userId,
        userName: `${item.user.firstName} ${item.user.lastName}`.trim(),
        userEmail: item.user.email,
        date: item.appointmentDate.toISOString(),
        time: item.timeLabel,
        locationId: item.locationId,
        locationName: item.locationName,
        locationAddress: item.locationAddress,
        bookedAt: item.bookedAt.toISOString(),
        status: item.status.toLowerCase(),
        staffId: item.staffId ?? undefined,
        staffName: item.staffName ?? undefined,
        completedAt: item.completedAt?.toISOString() ?? undefined,
        documentFileName: item.verification?.fileName ?? undefined,
      })),
    });
  } catch (error) {
    console.error("GET /api/staff/appointments error:", error);
    return NextResponse.json(
      { error: "Failed to load staff appointments" },
      { status: 500 }
    );
  }
}