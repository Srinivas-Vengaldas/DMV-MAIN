"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { SectionA } from "./section-a";
import { SectionB, type SectionBDefaults } from "./section-b";
import { SectionC } from "./section-c";
import { SectionD } from "./section-d";
import { SectionE } from "./section-e";
import { SectionF } from "./section-f";
import { SectionG } from "./section-g";
import { SectionH } from "./section-h";

const STEPS = [
  { label: "Personal Info", shortLabel: "Info", description: "Application type & personal details" },
  { label: "History", shortLabel: "History", description: "Driving & medical history" },
  { label: "Preferences", shortLabel: "Prefs", description: "Preferences & medical practitioner" },
  { label: "Registration", shortLabel: "Register", description: "Voter registration & certification" },
];

type DraftResponse =
  | { draft: null }
  | { draft: { applicationId: string; currentStep: number; data: Record<string, any> } };

function StepIndicator({ steps, currentStep }: { steps: typeof STEPS; currentStep: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-background text-primary"
                      : "border-muted-foreground/30 bg-background text-muted-foreground/50"
                }`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex flex-col items-center text-center">
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    isCurrent ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full transition-colors ${index < currentStep ? "bg-primary" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FormStepper() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  const [hasRemoteDraft, setHasRemoteDraft] = useState(false);
  const [remoteDraft, setRemoteDraft] = useState<null | DraftResponse["draft"]>(null);
  const [localDraftData, setLocalDraftData] = useState<Record<string, any>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);
  const lastSavedJson = useRef<string>("");

  const sectionBDefaults: SectionBDefaults | undefined = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        zip: user.zip,
      }
    : undefined;

  const getFormSnapshot = useCallback(() => {
    const formEl = formRef.current?.closest("form");
    if (!formEl) return null;

    const fd = new FormData(formEl);
    const data: Record<string, any> = {};

    fd.forEach((value, key) => {
      const v = value.toString();
      if (key in data) {
        const cur = data[key];
        data[key] = Array.isArray(cur) ? [...cur, v] : [cur, v];
      } else {
        data[key] = v;
      }
    });

    return data;
  }, []);

  const applySnapshotToForm = useCallback((snapshot: Record<string, any>) => {
    const formEl = formRef.current?.closest("form");
    if (!formEl) return;

    Object.entries(snapshot).forEach(([name, value]) => {
      const nodes = formEl.querySelectorAll(`[name="${CSS.escape(name)}"]`);
      const values = Array.isArray(value) ? value.map(String) : [value == null ? "" : String(value)];

      nodes.forEach((el) => {
        const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

        if (element instanceof HTMLInputElement && element.type === "radio") {
          element.checked = values.includes(element.value);
          return;
        }

        if (element instanceof HTMLInputElement && element.type === "checkbox") {
          element.checked = values.includes(element.value) || values.includes("on");
          return;
        }

        // @ts-expect-error value exists on these elements
        element.value = values[0] ?? "";
      });
    });
  }, []);

  const captureSnapshotToState = useCallback(() => {
    const snapshot = getFormSnapshot();
    if (!snapshot) return;

    setLocalDraftData((prev) => ({
      ...prev,
      ...snapshot,
    }));
  }, [getFormSnapshot]);

  const saveDraftNow = useCallback(
    async (stepOverride?: number) => {
      if (!user) {
        setSaveError("You must be logged in to save a draft.");
        return;
      }

      const snapshot = getFormSnapshot();
      if (!snapshot) return;

      const mergedSnapshot = {
        ...localDraftData,
        ...snapshot,
      };

      const stepToSave = typeof stepOverride === "number" ? stepOverride : currentStep;
      const json = JSON.stringify({ stepToSave, mergedSnapshot });

      if (json === lastSavedJson.current) return;

      setLocalDraftData(mergedSnapshot);
      setIsSaving(true);
      setSaveError(null);

      try {
        const res = await fetch("/application/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentStep: stepToSave, data: mergedSnapshot }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Draft save failed (${res.status})`);
        }

        lastSavedJson.current = json;
        setSavedPulse(true);
        window.setTimeout(() => setSavedPulse(false), 1200);
      } catch (e: any) {
        setSaveError(e?.message || "Failed to save draft");
      } finally {
        setIsSaving(false);
      }
    },
    [currentStep, getFormSnapshot, localDraftData, user]
  );

  const scheduleAutosave = useCallback(() => {
    captureSnapshotToState();

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(() => {
      void saveDraftNow();
    }, 800);
  }, [captureSnapshotToState, saveDraftNow]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/application/draft", { credentials: "include" });
        const data = (await res.json().catch(() => null)) as DraftResponse | null;

        if (cancelled) return;

        if (data && "draft" in data && data.draft) {
          setRemoteDraft(data.draft);
          setHasRemoteDraft(true);
        } else {
          setRemoteDraft(null);
          setHasRemoteDraft(false);
        }
      } catch {
        if (!cancelled) {
          setRemoteDraft(null);
          setHasRemoteDraft(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const restoreRemoteDraft = useCallback(() => {
    if (!remoteDraft) return;

    setCurrentStep(remoteDraft.currentStep || 0);
    setLocalDraftData(remoteDraft.data || {});

    window.setTimeout(() => {
      applySnapshotToForm(remoteDraft.data || {});
    }, 80);

    setHasRemoteDraft(false);
  }, [remoteDraft, applySnapshotToForm]);

  const discardRemoteDraftBanner = useCallback(() => {
    setHasRemoteDraft(false);
  }, []);

  const goNext = useCallback(async () => {
    if (currentStep >= STEPS.length - 1) return;

    captureSnapshotToState();
    await saveDraftNow(currentStep);
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, captureSnapshotToState, saveDraftNow]);

  const goPrev = useCallback(async () => {
    if (currentStep <= 0) return;

    captureSnapshotToState();
    await saveDraftNow(currentStep);
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, captureSnapshotToState, saveDraftNow]);

  useEffect(() => {
    const formEl = formRef.current?.closest("form");
    if (!formEl) return;

    const handler = () => scheduleAutosave();

    formEl.addEventListener("input", handler, true);
    formEl.addEventListener("change", handler, true);

    return () => {
      formEl.removeEventListener("input", handler, true);
      formEl.removeEventListener("change", handler, true);
    };
  }, [scheduleAutosave]);

  useEffect(() => {
    if (!Object.keys(localDraftData).length) return;

    const timer = window.setTimeout(() => {
      applySnapshotToForm(localDraftData);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [currentStep, localDraftData, applySnapshotToForm]);

  const submitApplication = useCallback(async () => {
    setSubmitError(null);

    captureSnapshotToState();
    await saveDraftNow(currentStep);

    setIsSubmitting(true);

    try {
      const res = await fetch("/application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (Array.isArray(data?.missing) && data.missing.length > 0) {
          const labels: Record<string, string> = {
            email: "Email",
            firstName: "First Name",
            lastName: "Last Name",
            phone: "Phone Number",
          };

          const missingLabels = data.missing.map((key: string) => labels[key] || key);
          throw new Error(`Please complete: ${missingLabels.join(", ")}`);
        }

        throw new Error(data?.error || `Submit failed (${res.status})`);
      }

      setShowSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e?.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, captureSnapshotToState, saveDraftNow]);

  return (
    <div ref={formRef} className="flex flex-col gap-6">
      {hasRemoteDraft && remoteDraft && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="text-sm text-foreground">
              You have a saved draft in the database. Restore it?
            </span>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={discardRemoteDraftBanner} className="text-xs">
              Not now
            </Button>
            <Button size="sm" onClick={restoreRemoteDraft} className="bg-primary text-xs text-primary-foreground hover:bg-primary/90">
              Restore
            </Button>
          </div>
        </div>
      )}

      {showSubmitSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-800">Application submitted successfully</h3>
                <p className="mt-1 text-sm text-green-700">
                  Your application has been submitted. You can now proceed to document upload.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmitSuccess(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/document-upload")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
        </p>

        <div className="mt-3 flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground">
          {isSaving ? (
            <span>Saving…</span>
          ) : savedPulse ? (
            <span className="text-primary">Saved</span>
          ) : (
            <span>Autosave enabled</span>
          )}
          {saveError ? <span className="text-destructive">{saveError}</span> : null}
          {submitError ? <span className="text-destructive">{submitError}</span> : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {currentStep === 0 && (
          <>
            <SectionA />
            <SectionB defaults={sectionBDefaults} />
          </>
        )}

        {currentStep === 1 && (
          <>
            <SectionC />
            <SectionD />
          </>
        )}

        {currentStep === 2 && (
          <>
            <SectionE />
            <SectionF />
          </>
        )}

        {currentStep === 3 && (
          <>
            <SectionG />
            <SectionH />

            <div className="flex flex-col gap-2 border border-foreground/30 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  To confidentially report waste, fraud or abuse by a DC Government Agency or
                  official, call the DC Inspector General at 1.800.521.1639
                </p>
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  Form revised February 2025
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 border-t border-foreground/20 pt-3 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Employee Signature
                  </label>
                  <div className="h-10 border-b border-foreground/30" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Date
                  </label>
                  <div className="h-10 border-b border-foreground/30" />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Questions: Please visit our website at{" "}
                <span className="font-medium text-foreground">dmv.dc.gov</span> or call 311 in DC
                or 202.737.4404 outside the 202 area code.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <Button type="button" variant="outline" onClick={goPrev} disabled={currentStep === 0} className="gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void saveDraftNow()}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            Save now
          </Button>
        </div>

        {currentStep < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={goNext}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting || isSaving}
            onClick={() => void submitApplication()}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting…" : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}