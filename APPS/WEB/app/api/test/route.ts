import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasJwt: !!process.env.JWT_SECRET,
  });
}