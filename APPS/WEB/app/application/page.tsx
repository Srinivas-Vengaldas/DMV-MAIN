"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { FormStepper } from "@/components/form/form-stepper";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

type ApplicationStatusResponse = {
  hasApplication: boolean;
  hasDraft: boolean;
  formSubmitted: boolean;
  applicationId: string | null;
  status: string | null;
  documentStatus?: "not_uploaded" | "pending" | "approved" | "rejected";
  canScheduleAppointment?: boolean;
  verification?: {
    id: string;
    caseNumber: string;
    fileName: string;
    status: string;
    submittedAt: string;
    reviewedAt: string | null;
    isException: boolean;
    exceptionReason: string;
    isStaffReview: boolean;
    aiConfidence: number;
  } | null;
};

export default function ApplicationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [documentStatus, setDocumentStatus] = useState<
    "not_uploaded" | "pending" | "approved" | "rejected"
  >("not_uploaded");
  const [canScheduleAppointment, setCanScheduleAppointment] = useState(false);
  const [verification, setVerification] = useState<ApplicationStatusResponse["verification"]>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/application/status", {
          credentials: "include",
          cache: "no-store",
        });

        const data = (await res.json().catch(() => null)) as ApplicationStatusResponse | null;

        if (!cancelled) {
          setFormSubmitted(!!data?.formSubmitted);
          setDocumentStatus(data?.documentStatus ?? "not_uploaded");
          setCanScheduleAppointment(!!data?.canScheduleAppointment);
          setVerification(data?.verification ?? null);
        }
      } catch {
        if (!cancelled) {
          setFormSubmitted(false);
          setDocumentStatus("not_uploaded");
          setCanScheduleAppointment(false);
          setVerification(null);
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router]);

  if (isLoading || !ready || statusLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (formSubmitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <Navbar />

        <div className="border-b border-border bg-muted">
          <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-xs text-muted-foreground sm:px-6">
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">My Application</span>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-green-800">Application Submitted</h1>
                  <p className="mt-1 text-sm text-green-700">
                    Your application has already been submitted successfully. You cannot edit the
                    form anymore from this page.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                Next Step: Document Upload & Review
              </h2>

              <div className="mt-4 space-y-4">
                <div className="rounded-md border border-border bg-background p-4">
                  <p className="text-xs uppercase text-muted-foreground">Application Status</p>
                  <p className="mt-1 text-sm font-medium text-foreground">Submitted</p>
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                  <p className="text-xs uppercase text-muted-foreground">Document Review Status</p>

                  {documentStatus === "not_uploaded" && (
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      Documents not uploaded yet
                    </p>
                  )}

                  {documentStatus === "pending" && (
                    <div className="mt-1 space-y-1">
                      <p className="text-sm font-medium text-blue-700">
                        Documents uploaded — awaiting review
                      </p>
                      {verification?.fileName && (
                        <p className="text-xs text-muted-foreground">
                          File: {verification.fileName}
                        </p>
                      )}
                      {verification?.submittedAt && (
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(verification.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {documentStatus === "approved" && (
                    <div className="mt-1 space-y-1">
                      <p className="text-sm font-medium text-green-700">Documents approved</p>
                      {verification?.fileName && (
                        <p className="text-xs text-muted-foreground">
                          File: {verification.fileName}
                        </p>
                      )}
                      {verification?.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          Approved: {new Date(verification.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {documentStatus === "rejected" && (
                    <div className="mt-1 space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        Documents need attention
                      </p>
                      {verification?.fileName && (
                        <p className="text-xs text-muted-foreground">
                          File: {verification.fileName}
                        </p>
                      )}
                      {verification?.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          Reviewed: {new Date(verification.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {canScheduleAppointment ? (
                  <button
                    type="button"
                    onClick={() => router.push("/appointment")}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Go to Schedule Appointment
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/document-upload")}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Go to Document Upload
                  </button>
                )}

                {documentStatus === "approved" && (
                  <button
                    type="button"
                    onClick={() => router.push("/appointment")}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Schedule Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />

      <div className="border-b border-border bg-muted">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">DL/ID Application</span>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl">
              DC Driver License or Identification Card
            </h1>
            <h2 className="text-lg font-bold uppercase text-foreground">Application</h2>
            <p className="mt-2 text-xs italic text-muted-foreground">
              The information you provide will be used to register you to vote unless you decline in
              Section G.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <FormStepper />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}