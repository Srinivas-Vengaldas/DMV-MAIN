"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface StepItem {
  label: string;
  description: string;
  status: "completed" | "in-progress" | "pending" | "error" | "verifying";
}

interface VerificationResponse {
  verification: {
    id: string;
    documentType: string;
    fileName: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    aiStatus:
      | "PENDING"
      | "TIMED_OUT"
      | "APPROVED_BY_AI"
      | "APPROVED_BY_STAFF"
      | "REJECTED_BY_STAFF";
    isStaffReview: boolean;
    aiConfidence?: number | null;
    ocrText?: string | null;
    extractedFields?: {
      documentType?: string;
      tenantName?: string;
      landlordName?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      leaseStartDate?: string;
    } | null;
    submittedAt: string;
    sentToStaffAt?: string | null;
    reviewedAt?: string | null;
    reviewNotes?: string;
  } | null;
}

interface CurrentAppointmentResponse {
  appointment: {
    id: string;
    locationName: string;
    appointmentDate: string;
    timeLabel: string;
    status: "scheduled" | "completed" | "cancelled" | "no_show";
  } | null;
}

function defaultSteps(): StepItem[] {
  return [
    {
      label: "Application Form",
      description: "Personal information submitted",
      status: "completed",
    },
    {
      label: "Document Upload",
      description: "Upload required documents",
      status: "in-progress",
    },
    {
      label: "Document Verification",
      description: "AI-powered verification",
      status: "pending",
    },
    {
      label: "Appointment Scheduling",
      description: "Book your DMV visit",
      status: "pending",
    },
  ];
}

export function ProgressSidebar() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<StepItem[]>(defaultSteps());

  useEffect(() => {
    if (!user) return;

    const updateSteps = async () => {
      try {
        const [verificationRes, appointmentRes] = await Promise.all([
          fetch("/api/verification/me", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/appointment/current", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const verificationData =
          (await verificationRes.json().catch(() => null)) as VerificationResponse | null;

        const appointmentData =
          (await appointmentRes.json().catch(() => null)) as CurrentAppointmentResponse | null;

        const hasScheduledAppointment =
          appointmentRes.ok &&
          !!appointmentData?.appointment &&
          appointmentData.appointment.status === "scheduled";

        if (!verificationRes.ok || !verificationData?.verification) {
          setSteps(defaultSteps());
          return;
        }

        const verification = verificationData.verification;

        if (verification.status === "APPROVED") {
          setSteps([
            {
              label: "Application Form",
              description: "Personal information submitted",
              status: "completed",
            },
            {
              label: "Document Upload",
              description: "Document submitted",
              status: "completed",
            },
            {
              label: "Document Verification",
              description: "Verification complete",
              status: "completed",
            },
            {
              label: "Appointment Scheduling",
              description: hasScheduledAppointment
                ? "Appointment scheduled"
                : "Book your DMV visit",
              status: hasScheduledAppointment ? "completed" : "in-progress",
            },
          ]);
          return;
        }

        if (verification.status === "REJECTED") {
          setSteps([
            {
              label: "Application Form",
              description: "Personal information submitted",
              status: "completed",
            },
            {
              label: "Document Upload",
              description: "Document submitted",
              status: "completed",
            },
            {
              label: "Document Verification",
              description: "Verification failed",
              status: "error",
            },
            {
              label: "Appointment Scheduling",
              description: "Book your DMV visit",
              status: "pending",
            },
          ]);
          return;
        }

        if (verification.status === "PENDING") {
          setSteps([
            {
              label: "Application Form",
              description: "Personal information submitted",
              status: "completed",
            },
            {
              label: "Document Upload",
              description: "Document submitted",
              status: "completed",
            },
            {
              label: "Document Verification",
              description: verification.isStaffReview
                ? "Pending staff review"
                : "Verification pending approval...",
              status: verification.isStaffReview ? "error" : "verifying",
            },
            {
              label: "Appointment Scheduling",
              description: "Book your DMV visit",
              status: "pending",
            },
          ]);
          return;
        }

        setSteps(defaultSteps());
      } catch (error) {
        console.error("Failed to load progress sidebar status:", error);
        setSteps(defaultSteps());
      }
    };

    updateSteps();
    const interval = setInterval(updateSteps, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
        Application Progress
      </h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, index) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  step.status === "completed"
                    ? "border-green-600 bg-green-600 text-card"
                    : step.status === "in-progress"
                      ? "border-primary bg-primary/10 text-primary"
                      : step.status === "verifying"
                        ? "border-red-500 bg-red-500 text-card"
                        : step.status === "error"
                          ? "border-amber-500 bg-amber-500 text-card"
                          : "border-muted-foreground/30 bg-background text-muted-foreground/40"
                }`}
              >
                {step.status === "verifying" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                )}

                {step.status === "completed" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : step.status === "in-progress" ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                ) : step.status === "verifying" ? (
                  <div className="relative h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                ) : step.status === "error" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`min-h-8 w-0.5 flex-1 ${
                    step.status === "completed"
                      ? "bg-green-600"
                      : step.status === "verifying"
                        ? "bg-red-400 animate-pulse"
                        : step.status === "error"
                          ? "bg-amber-400"
                          : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>

            <div className="flex flex-col gap-0.5 pb-6">
              <span
                className={`text-sm font-semibold leading-tight ${
                  step.status === "completed"
                    ? "text-green-700"
                    : step.status === "in-progress"
                      ? "text-foreground"
                      : step.status === "verifying"
                        ? "animate-pulse text-red-700"
                        : step.status === "error"
                          ? "text-amber-700"
                          : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`text-xs leading-snug ${
                  step.status === "completed"
                    ? "text-green-600"
                    : step.status === "in-progress"
                      ? "text-muted-foreground"
                      : step.status === "verifying"
                        ? "font-medium text-red-600"
                        : step.status === "error"
                          ? "text-amber-600"
                          : "text-muted-foreground/50"
                }`}
              >
                {step.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}