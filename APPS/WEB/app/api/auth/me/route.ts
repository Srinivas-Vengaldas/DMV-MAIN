import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { userId } = verifySession(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        zip: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        user: user
          ? {
              ...user,
              name: `${user.firstName} ${user.lastName}`,
              createdAt: user.createdAt.toISOString(),
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth /me error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}