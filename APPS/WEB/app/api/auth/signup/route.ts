import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs"; // IMPORTANT for Prisma on Vercel/Next

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      city,
      zip,
    } = await req.json();

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address: address ?? null,
        city: city ?? null,
        zip: zip ?? null,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const token = signSession({ userId: user.id, email: user.email });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    // show the real reason in your terminal (and in response during dev)
    console.error("SIGNUP_ERROR:", e);

    const message =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? e.message
        : "Server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}