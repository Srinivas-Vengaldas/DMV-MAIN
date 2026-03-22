"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

type UploadStatus =
  | "idle"
  | "uploaded"
  | "uploading"
  | "verifying"
  | "approved"
  | "rejected"
  | "support-requested"
  | "error";

interface DocumentState {
  file: File | null;
  fileName: string;
  status: UploadStatus;
  progress: number;
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
      leaseEndDate?: string;
    } | null;
    submittedAt: string;
    sentToStaffAt?: string | null;
    reviewedAt?: string | null;
    reviewNotes?: string;
  } | null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentUploader() {
  const router = useRouter();
  const { user } = useAuth();

  const [leaseDoc, setLeaseDoc] = useState<DocumentState>({
    file: null,
    fileName: "",
    status: "idle",
    progress: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadVerificationStatus = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch("/api/verification/me", {
        credentials: "include",
        cache: "no-store",
      });

      const data: VerificationResponse = await res.json();

      if (!res.ok) {
        throw new Error((data as any)?.error || "Failed to load verification status");
      }

      const verification = data?.verification;

      if (!verification) {
        setLeaseDoc((prev) => {
          if (prev.status === "uploading" || prev.status === "uploaded") return prev;
          return {
            file: null,
            fileName: "",
            status: "idle",
            progress: 0,
          };
        });
        return;
      }

      if (verification.status === "APPROVED") {
        setLeaseDoc({
          file: null,
          fileName: verification.fileName || "Document",
          status: "approved",
          progress: 100,
        });
        return;
      }

      if (verification.status === "REJECTED") {
        setLeaseDoc({
          file: null,
          fileName: verification.fileName || "Document",
          status: "rejected",
          progress: 100,
        });
        return;
      }

      if (verification.status === "PENDING") {
        setLeaseDoc({
          file: null,
          fileName: verification.fileName || "Document",
          status: verification.isStaffReview ? "support-requested" : "verifying",
          progress: 100,
        });
        return;
      }

      setLeaseDoc({
        file: null,
        fileName: "",
        status: "idle",
        progress: 0,
      });
    } catch (error) {
      console.error("Failed to load verification status:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadVerificationStatus();
  }, [user, loadVerificationStatus]);

  useEffect(() => {
    if (!user) return;
    if (leaseDoc.status !== "verifying" && leaseDoc.status !== "support-requested") return;

    loadVerificationStatus();
    const interval = setInterval(loadVerificationStatus, 5000);

    return () => clearInterval(interval);
  }, [leaseDoc.status, user, loadVerificationStatus]);

  const handleFile = useCallback((file: File) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      setLeaseDoc({
        file: null,
        fileName: file.name,
        status: "error",
        progress: 0,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLeaseDoc({
        file: null,
        fileName: file.name,
        status: "error",
        progress: 0,
      });
      return;
    }

    setLeaseDoc({
      file,
      fileName: file.name,
      status: "uploading",
      progress: 0,
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setLeaseDoc((prev) => ({
          ...prev,
          status: "uploaded",
          progress: 100,
        }));
      } else {
        setLeaseDoc((prev) => ({
          ...prev,
          progress: Math.min(progress, 99),
        }));
      }
    }, 200);
  }, []);

  const handleSubmitForVerification = useCallback(async () => {
    if (!user || !leaseDoc.file) return;

    setLeaseDoc((prev) => ({
      ...prev,
      status: "verifying",
    }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", leaseDoc.file);

      const uploadRes = await fetch("/api/storage/upload-document", {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || "Failed to upload document");
      }

      if (!uploadData?.path) {
        throw new Error("Upload succeeded but no file path was returned");
      }

      const storedFilePath = uploadData.path;
      const imageDataUrl = await fileToDataUrl(leaseDoc.file);

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl }),
      });

      const ocrData = await ocrRes.json();

      if (!ocrRes.ok || !ocrData?.result) {
        throw new Error(ocrData?.error || "OCR failed");
      }

      const extracted = ocrData.result;

      const extractedFields = {
        documentType: extracted.document_type || "",
        tenantName: extracted.tenant_name || "",
        landlordName: extracted.landlord_name || "",
        address: extracted.address || "",
        city: extracted.city || "",
        state: extracted.state || "",
        zipCode: extracted.zip_code || "",
        leaseStartDate: extracted.lease_start_date || "",
        leaseEndDate: extracted.lease_end_date || "",
      };

      const submitRes = await fetch("/api/verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          documentType: extracted.document_type || "Lease Document",
          fileName: leaseDoc.fileName,
          fileUrl: storedFilePath,
          ocrText: extracted.raw_text || "",
          extractedFields,
          aiConfidence:
            typeof extracted.confidence === "number" ? extracted.confidence : 0,
        }),
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok) {
        throw new Error(submitData?.error || "Failed to save verification record");
      }

      await loadVerificationStatus();
    } catch (error) {
      console.error("OCR submit error:", error);
      setLeaseDoc((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  }, [user, leaseDoc.file, leaseDoc.fileName, loadVerificationStatus]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleReset = () => {
    setLeaseDoc({
      file: null,
      fileName: "",
      status: "idle",
      progress: 0,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRequestSupport = useCallback(() => {
    alert("Manual support request is not connected to the database yet.");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Lease Documents</h3>
              <p className="text-xs text-muted-foreground">
                Proof of residency - lease agreement or utility bill
              </p>
            </div>
          </div>

          {leaseDoc.status === "uploaded" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Ready
            </span>
          )}

          {leaseDoc.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Approved
            </span>
          )}

          {leaseDoc.status === "verifying" && (
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
              </span>
              AI Pending
            </span>
          )}

          {leaseDoc.status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              Rejected
            </span>
          )}

          {leaseDoc.status === "support-requested" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Staff Review
            </span>
          )}
        </div>

        <div className="p-5">
          {leaseDoc.status === "idle" || leaseDoc.status === "error" ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop your file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports PDF, PNG, JPG, JPEG (max 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {leaseDoc.status === "error" && (
                <p className="mt-2 text-xs text-destructive">
                  Invalid file type or file too large. Please upload a PNG, JPG, JPEG image under 10MB.
                </p>
              )}
            </>
          ) : leaseDoc.status === "uploading" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {Math.round(leaseDoc.progress)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${leaseDoc.progress}%` }}
                />
              </div>
            </div>
          ) : leaseDoc.status === "uploaded" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs text-blue-700">Document uploaded successfully</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-blue-100/60 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="text-xs text-blue-700">
                  Your document is ready. Click submit to start verification.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitForVerification}
                  className="gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  Submit for Verification
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Change Document
                </Button>
              </div>
            </div>
          ) : leaseDoc.status === "verifying" ? (
            <div className="animate-pulse flex flex-col gap-4 rounded-lg border-2 border-red-300 bg-red-50 p-5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative text-red-600"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs font-semibold text-red-700">
                    AI verification in progress...
                  </p>
                </div>
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-600"></span>
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-100 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-600 animate-pulse"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="text-xs font-medium text-red-700">
                  Your document has been submitted. If AI does not complete verification within 1 minute, it will be sent to staff review automatically.
                </p>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-200">
                <div className="h-full w-full rounded-full bg-red-500" />
              </div>
            </div>
          ) : leaseDoc.status === "approved" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs text-green-700">Document verified and approved</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-green-100/60 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <p className="text-xs text-green-700">
                  Your document has been approved. You can now proceed to schedule your appointment.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push("/appointment")}
                  className="gap-1.5 bg-green-600 text-xs text-white hover:bg-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Proceed to Schedule Appointment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Upload a different document
                </Button>
              </div>
            </div>
          ) : leaseDoc.status === "rejected" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs text-red-700">Document verification failed</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-red-100/60 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-600"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="text-xs text-red-700">
                  The document could not be verified automatically. It may be unclear, expired, or invalid.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Try a different document
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRequestSupport}
                  className="gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Request Staff Support
                </Button>
              </div>
            </div>
          ) : leaseDoc.status === "support-requested" ? (
            <div className="flex flex-col gap-4 rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{leaseDoc.fileName}</p>
                  <p className="text-xs text-blue-700">Staff review required</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-blue-100/60 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="text-xs text-blue-700">
                  Your document is awaiting manual staff review.
                </p>
              </div>

              <div className="rounded-md bg-blue-100/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">What happens next?</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-blue-700">
                      A staff member will review your document. You can check status on this page.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="self-start gap-1.5 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                Upload a different document instead
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <h4 className="text-sm font-bold text-foreground">Accepted Documents</h4>
        <ul className="mt-2 flex flex-col gap-1.5">
          {[
            "Current signed lease agreement",
            "Utility bill (within last 60 days)",
            "Bank statement showing DC address",
            "Government-issued document with DC address",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary"><polyline points="20 6 9 17 4 12" /></svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}