// app/api/application/draft/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const META_KEY = "__META__";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const payload = verifySession(token);
    return payload.userId;
  } catch {
    return null;
  }
}

async function getOrCreateDraftApplication(userId: string) {
  // If you want ONLY one draft per user, keep it like this:
  let app = await prisma.application.findFirst({
    where: { userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  if (!app) {
    app = await prisma.application.create({
      data: { userId, status: "DRAFT" },
    });
  }

  return app;
}

// GET /api/application/draft
export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ draft: null }, { status: 200 });

    const app = await prisma.application.findFirst({
      where: { userId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: { steps: true },
    });

    if (!app) return NextResponse.json({ draft: null }, { status: 200 });

    // Get meta (currentStep)
    const meta = app.steps.find((s) => s.stepKey === META_KEY)?.payload as any;
    const currentStep = typeof meta?.currentStep === "number" ? meta.currentStep : 0;

    // Merge all step payloads into one "data" object
    const data: Record<string, any> = {};
    for (const s of app.steps) {
      if (s.stepKey === META_KEY) continue;
      const payload = s.payload as any;
      if (payload?.data && typeof payload.data === "object") {
        Object.assign(data, payload.data);
      }
    }

    return NextResponse.json(
      { draft: { applicationId: app.id, currentStep, data } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ draft: null }, { status: 200 });
  }
}

// POST /api/application/draft
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const currentStep = Number(body?.currentStep ?? 0);
    const data = body?.data ?? {};

    if (!Number.isFinite(currentStep) || currentStep < 0) {
      return NextResponse.json({ error: "Invalid currentStep" }, { status: 400 });
    }

    const app = await getOrCreateDraftApplication(userId);
    const stepKey = `STEP_${currentStep}`;

    // Save step snapshot
    await prisma.applicationStep.upsert({
      where: { applicationId_stepKey: { applicationId: app.id, stepKey } },
      create: {
        applicationId: app.id,
        stepKey,
        payload: { data },
      },
      update: {
        payload: { data },
      },
    });

    // Save meta (currentStep)
    await prisma.applicationStep.upsert({
      where: { applicationId_stepKey: { applicationId: app.id, stepKey: META_KEY } },
      create: {
        applicationId: app.id,
        stepKey: META_KEY,
        payload: { currentStep },
      },
      update: {
        payload: { currentStep },
      },
    });

    // Touch updatedAt
    await prisma.application.update({
      where: { id: app.id },
      data: { status: "DRAFT" },
    });

    return NextResponse.json({ ok: true, applicationId: app.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}