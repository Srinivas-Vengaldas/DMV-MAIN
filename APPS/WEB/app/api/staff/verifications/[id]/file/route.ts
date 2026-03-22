import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "document-verifications";

export async function GET(
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Verification id is required" }, { status: 400 });
    }

    const verification = await prisma.documentVerification.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    if (!verification.fileUrl || typeof verification.fileUrl !== "string") {
      return NextResponse.json(
        { error: "No uploaded document found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(verification.fileUrl, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to generate file preview URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("GET /api/staff/verifications/[id]/file error:", error);
    return NextResponse.json(
      { error: "Failed to load uploaded document" },
      { status: 500 }
    );
  }
}