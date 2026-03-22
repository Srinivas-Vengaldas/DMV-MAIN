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

    const notes = await prisma.caseNote.findMany({
      where: {
        verification: {
          isActive: true,
        },
      },
      include: {
        staff: true,
        resident: true,
        verification: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      notes: notes.map((note) => ({
        id: note.id,
        verificationId: note.verificationId,
        documentType: note.documentType,
        userName: `${note.resident.firstName} ${note.resident.lastName}`,
        staffId: note.staffId,
        staffName: `${note.staff.firstName} ${note.staff.lastName}`,
        note: note.note,
        createdAt: note.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/staff/case-notes error:", error);
    return NextResponse.json(
      { error: "Failed to load case notes" },
      { status: 500 }
    );
  }
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

    if (session.role !== "STAFF" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { verificationId, note } = await req.json();

    if (!verificationId || !note?.trim()) {
      return NextResponse.json(
        { error: "verificationId and note are required" },
        { status: 400 }
      );
    }

    const verification = await prisma.documentVerification.findUnique({
      where: { id: verificationId },
      include: {
        user: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    if (!verification.isActive) {
      return NextResponse.json(
        { error: "Cannot add note to an inactive verification" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.caseNote.create({
        data: {
          verificationId: verification.id,
          staffId: session.userId,
          residentId: verification.userId,
          documentType: verification.documentType,
          note: note.trim(),
        },
      });

      await tx.staffActivity.create({
        data: {
          staffId: session.userId,
          verificationId: verification.id,
          action: "NOTE_ADDED",
          notes: note.trim(),
        },
      });

      return createdNote;
    });

    return NextResponse.json({
      success: true,
      note: {
        id: result.id,
        verificationId: result.verificationId,
        documentType: result.documentType,
        note: result.note,
        createdAt: result.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/staff/case-notes error:", error);
    return NextResponse.json(
      { error: "Failed to create case note" },
      { status: 500 }
    );
  }
}