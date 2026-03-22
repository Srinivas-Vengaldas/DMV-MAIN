"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

interface VerificationRequest {
  id: string
  caseNumber?: string
  userId: string
  userName: string
  userEmail: string
  documentType: string
  fileName: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  aiConfidence: number
  isStaffReview: boolean

  isException?: boolean
  exceptionReason?: string
  flaggedAt?: string | null
  flaggedById?: string | null

  reviewedBy?: string
  reviewedAt?: string
  notes?: string
  ocrText?: string
  aiStatus?: string
  sentToStaffAt?: string | null

  extractedFields?: {
    documentType?: string
    tenantName?: string
    landlordName?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    leaseStartDate?: string
    leaseEndDate?: string
  }

  residentInfo?: {
    fullName?: string
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
  }
}

interface VerificationCounts {
  pending: number
  staffReview: number
  lowConfidence: number
  reviewed: number
}

function normalizeValue(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim()
}

function valuesLooselyMatch(a?: string, b?: string) {
  const first = normalizeValue(a)
  const second = normalizeValue(b)

  if (!first || !second) return false
  return first.includes(second) || second.includes(first)
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function StaffReviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [queue, setQueue] = useState<VerificationRequest[]>([])
  const [counts, setCounts] = useState<VerificationCounts>({
    pending: 0,
    staffReview: 0,
    lowConfidence: 0,
    reviewed: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "staff-review" | "low-confidence" | "reviewed">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [selectedDoc, setSelectedDoc] = useState<VerificationRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [isFlagging, setIsFlagging] = useState(false)

  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentViewerUrl, setDocumentViewerUrl] = useState<string | null>(null)
  const [documentViewerLoading, setDocumentViewerLoading] = useState(false)

  const [showRawOcr, setShowRawOcr] = useState(false)

  const closeReviewDialog = useCallback(() => {
    setSelectedDoc(null)
    setReviewNotes("")
    setShowRawOcr(false)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("case")

    const nextUrl = params.toString()
      ? `/staff/review?${params.toString()}`
      : "/staff/review"

    router.replace(nextUrl)
  }, [router, searchParams])

  const loadQueue = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        const params = new URLSearchParams()

        if (filter !== "all") {
          params.set("filter", filter)
        }

        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim())
        }

        const queryString = params.toString()
        const url = queryString
          ? `/api/staff/verifications?${queryString}`
          : "/api/staff/verifications"

        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load verifications")
        }

        setQueue(data.verifications || [])
        setCounts(
          data.counts || {
            pending: 0,
            staffReview: 0,
            lowConfidence: 0,
            reviewed: 0,
          }
        )
      } catch (error) {
        console.error("Failed to load staff queue:", error)
        if (!silent) {
          setQueue([])
          setCounts({
            pending: 0,
            staffReview: 0,
            lowConfidence: 0,
            reviewed: 0,
          })
        }
      } finally {
        if (silent) {
          setIsRefreshing(false)
        } else {
          setIsLoading(false)
        }
      }
    },
    [filter, searchQuery]
  )

  useEffect(() => {
    loadQueue(false)
    const interval = setInterval(() => {
      loadQueue(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [loadQueue])

  useEffect(() => {
    const caseParam = searchParams.get("case")
    if (!caseParam || selectedDoc) return

    const loadSpecificCase = async () => {
      try {
        const res = await fetch(`/api/staff/verifications?case=${encodeURIComponent(caseParam)}`, {
          credentials: "include",
          cache: "no-store",
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load case")
        }

        const matched = data.verifications?.[0]
        if (matched) {
          setSelectedDoc(matched)
          setReviewNotes(matched.notes || "")
          setShowRawOcr(false)
        }
      } catch (error) {
        console.error("Failed to auto-load case:", error)
      }
    }

    loadSpecificCase()
  }, [searchParams, selectedDoc])

  const handleApprove = async () => {
    if (!selectedDoc) return
    setIsReviewing(true)

    try {
      const res = await fetch("/api/staff/verifications/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          verificationId: selectedDoc.id,
          decision: "APPROVED",
          notes: reviewNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to approve verification")
      }

      closeReviewDialog()
      await loadQueue(true)
    } catch (error) {
      console.error("Approve failed:", error)
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc) return
    setIsReviewing(true)

    try {
      const res = await fetch("/api/staff/verifications/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          verificationId: selectedDoc.id,
          decision: "REJECTED",
          notes: reviewNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to reject verification")
      }

      closeReviewDialog()
      await loadQueue(true)
    } catch (error) {
      console.error("Reject failed:", error)
    } finally {
      setIsReviewing(false)
    }
  }

  const handleFlagException = async () => {
    if (!selectedDoc) return
    setIsFlagging(true)

    try {
      const res = await fetch("/api/staff/verifications/flag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          verificationId: selectedDoc.id,
          reason: reviewNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to flag exception")
      }

      closeReviewDialog()
      await loadQueue(true)
    } catch (error) {
      console.error("Flag exception failed:", error)
    } finally {
      setIsFlagging(false)
    }
  }

  const handleOpenDocument = useCallback(async () => {
    if (!selectedDoc) return

    try {
      setDocumentViewerLoading(true)
      setDocumentViewerOpen(true)

      const res = await fetch(`/api/staff/verifications/${selectedDoc.id}/file`, {
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load document")
      }

      setDocumentViewerUrl(data?.signedUrl || null)
    } catch (error) {
      console.error("Failed to open document:", error)
      setDocumentViewerUrl(null)
    } finally {
      setDocumentViewerLoading(false)
    }
  }, [selectedDoc])

  const visibleDocs = queue
    .filter((v) => {
      if (filter === "reviewed") {
        return v.status === "approved" || v.status === "rejected"
      }

      if (v.status !== "pending") return false

      if (filter === "staff-review") return v.isStaffReview
      if (filter === "low-confidence") return v.aiConfidence < 0.7

      return true
    })
    .filter((v) =>
      v.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.caseNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const pendingCount = counts.pending
  const staffReviewCount = counts.staffReview
  const lowConfidenceCount = counts.lowConfidence
  const reviewedCount = counts.reviewed

  const comparison = useMemo(() => {
    if (!selectedDoc) {
      return {
        residentFullName: "",
        leaseTenantName: "",
        residentAddress: "",
        leaseAddress: "",
        residentZip: "",
        leaseZip: "",
        nameMatch: false,
        addressMatch: false,
        zipMatch: false,
      }
    }

    const residentFullName =
      selectedDoc.residentInfo?.fullName ||
      [selectedDoc.residentInfo?.firstName, selectedDoc.residentInfo?.lastName]
        .filter(Boolean)
        .join(" ")

    const leaseTenantName = selectedDoc.extractedFields?.tenantName || ""
    const residentAddress = selectedDoc.residentInfo?.address || ""
    const leaseAddress = selectedDoc.extractedFields?.address || ""
    const residentZip = selectedDoc.residentInfo?.zipCode || ""
    const leaseZip = selectedDoc.extractedFields?.zipCode || ""

    return {
      residentFullName,
      leaseTenantName,
      residentAddress,
      leaseAddress,
      residentZip,
      leaseZip,
      nameMatch: valuesLooselyMatch(residentFullName, leaseTenantName),
      addressMatch: valuesLooselyMatch(residentAddress, leaseAddress),
      zipMatch:
        normalizeValue(residentZip) !== "" &&
        normalizeValue(residentZip) === normalizeValue(leaseZip),
    }
  }, [selectedDoc])

  const isPdf = selectedDoc?.fileName?.toLowerCase().endsWith(".pdf")
  const isReviewedCase = selectedDoc?.status === "approved" || selectedDoc?.status === "rejected"

  const handleExportReport = () => {
    const headers = [
      "Case Number",
      "Resident Name",
      "Email",
      "Document Type",
      "File Name",
      "Status",
      "AI Confidence",
      "Submitted At",
      "Reviewed At",
      "Exception Flagged",
      "Exception Reason",
    ]

    const rows = visibleDocs.map((doc) => [
      doc.caseNumber || "",
      doc.userName,
      doc.userEmail,
      doc.documentType,
      doc.fileName,
      doc.status,
      `${Math.round(doc.aiConfidence * 100)}%`,
      new Date(doc.submittedAt).toLocaleString(),
      doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleString() : "",
      doc.isException ? "Yes" : "No",
      doc.exceptionReason || "",
    ])

    downloadCsv(
      filter === "reviewed" ? "reviewed-cases-report.csv" : "document-review-report.csv",
      [headers, ...rows]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Document Review</h1>
        <p className="text-sm text-muted-foreground">
          Review and verify documents flagged by AI or requested for staff review
        </p>
        {user && (
          <p className="text-xs text-muted-foreground">
            Signed in as {user.name}
          </p>
        )}
        {isRefreshing && (
          <p className="text-xs text-muted-foreground">Refreshing…</p>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={filter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter("all")}
              >
                All Pending ({pendingCount})
              </Badge>
              <Badge
                variant={filter === "staff-review" ? "default" : "outline"}
                className={`cursor-pointer ${filter === "staff-review" ? "bg-red-600" : ""}`}
                onClick={() => setFilter("staff-review")}
              >
                Staff Review ({staffReviewCount})
              </Badge>
              <Badge
                variant={filter === "low-confidence" ? "default" : "outline"}
                className={`cursor-pointer ${filter === "low-confidence" ? "bg-orange-600" : ""}`}
                onClick={() => setFilter("low-confidence")}
              >
                Low Confidence ({lowConfidenceCount})
              </Badge>
              <Badge
                variant={filter === "reviewed" ? "default" : "outline"}
                className={`cursor-pointer ${filter === "reviewed" ? "bg-slate-700" : ""}`}
                onClick={() => setFilter("reviewed")}
              >
                Reviewed Cases ({reviewedCount})
              </Badge>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportReport}
                disabled={visibleDocs.length === 0}
              >
                Generate Report
              </Button>

              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filter === "reviewed" ? "Reviewed Cases" : "Pending Reviews"}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading documents..."
              : filter === "reviewed"
                ? `${visibleDocs.length} reviewed case${visibleDocs.length !== 1 ? "s" : ""}`
                : `${visibleDocs.length} document${visibleDocs.length !== 1 ? "s" : ""} awaiting review`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">Loading documents...</p>
            </div>
          ) : visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {filter === "reviewed" ? "No reviewed cases" : "No pending documents"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filter === "reviewed"
                  ? "No approved or rejected cases found"
                  : "All documents have been reviewed"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    doc.isStaffReview ? "border-red-200 bg-red-50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      doc.status === "approved"
                        ? "bg-green-100"
                        : doc.status === "rejected"
                          ? "bg-red-100"
                          : doc.isStaffReview
                            ? "bg-red-100"
                            : doc.aiConfidence < 0.7
                              ? "bg-orange-100"
                              : "bg-amber-100"
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={
                        doc.status === "approved"
                          ? "text-green-600"
                          : doc.status === "rejected"
                            ? "text-red-600"
                            : doc.isStaffReview
                              ? "text-red-600"
                              : doc.aiConfidence < 0.7
                                ? "text-orange-600"
                                : "text-amber-600"
                      }><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {doc.caseNumber || "No Case ID"}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{doc.documentType}</p>

                        {doc.isStaffReview && doc.status === "pending" && (
                          <Badge variant="destructive" className="text-[10px]">
                            Staff Review Required
                          </Badge>
                        )}

                        {doc.isException && (
                          <Badge className="bg-red-100 text-red-700 text-[10px] hover:bg-red-100">
                            Exception Flagged
                          </Badge>
                        )}

                        {filter === "reviewed" && (
                          <Badge
                            className={
                              doc.status === "approved"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-red-100 text-red-700 hover:bg-red-100"
                            }
                          >
                            {doc.status}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {doc.userName} • {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(doc.submittedAt).toLocaleString()}
                      </p>
                      {doc.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          Reviewed {new Date(doc.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">AI Confidence</p>
                      <Badge variant="secondary" className={`${
                        doc.aiConfidence >= 0.8 ? "bg-green-100 text-green-700" :
                        doc.aiConfidence >= 0.6 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {Math.round(doc.aiConfidence * 100)}%
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(doc)
                        setReviewNotes(doc.notes || "")
                        setShowRawOcr(false)
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedDoc}
        onOpenChange={(open) => {
          if (!open) {
            closeReviewDialog()
          }
        }}
      >
        <DialogContent className="!h-[94vh] !w-[96vw] !max-w-[1100px] overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Compare the uploaded document with the resident’s submitted information, then approve, reject, or flag it as an exception.
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="flex flex-col gap-6 py-4">
              <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Document Information</Label>
                    <div className="mt-2 rounded-lg border border-border p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-base font-semibold">{selectedDoc.fileName}</p>
                          <p className="text-sm text-muted-foreground">{selectedDoc.documentType}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-5 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Case ID</p>
                          <p className="font-medium">{selectedDoc.caseNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted By</p>
                          <p className="font-medium">{selectedDoc.userName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium break-all">{selectedDoc.userEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted At</p>
                          <p className="font-medium">{new Date(selectedDoc.submittedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Status</p>
                          <Badge
                            className={
                              selectedDoc.status === "approved"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : selectedDoc.status === "rejected"
                                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {selectedDoc.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">AI Confidence</p>
                          <Badge
                            variant="secondary"
                            className={`${
                              selectedDoc.aiConfidence >= 0.8
                                ? "bg-green-100 text-green-700"
                                : selectedDoc.aiConfidence >= 0.6
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {Math.round(selectedDoc.aiConfidence * 100)}%
                          </Badge>
                        </div>
                      </div>

                      {isReviewedCase && (
                        <div className="mt-5 rounded-md border border-border bg-muted/40 p-3">
                          <p className="text-xs font-semibold text-foreground">Reviewed Case</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            This case has already been {selectedDoc.status}.
                            {selectedDoc.reviewedAt ? ` Reviewed on ${new Date(selectedDoc.reviewedAt).toLocaleString()}.` : ""}
                          </p>
                        </div>
                      )}

                      {selectedDoc.isStaffReview && (
                        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3">
                          <p className="text-xs font-semibold text-red-800">Staff Review Requested</p>
                          <p className="mt-1 text-xs text-red-600">
                            This document was escalated to manual review because AI verification did not complete in time or the resident requested staff support.
                          </p>
                        </div>
                      )}

                      {selectedDoc.isException && (
                        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3">
                          <p className="text-xs font-semibold text-red-800">Exception Flagged</p>
                          <p className="mt-1 text-xs text-red-600">
                            {selectedDoc.exceptionReason || "Flagged by staff for exception review."}
                          </p>
                        </div>
                      )}

                      <div className="mt-5">
                        <Button type="button" variant="outline" onClick={handleOpenDocument}>
                          View Document
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Side-by-Side Comparison</Label>
                    <div className="mt-2 rounded-lg border border-border p-6">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 rounded-md border p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Resident Full Name</p>
                            <p className="font-medium">{comparison.residentFullName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Lease Tenant Name</p>
                            <p className="font-medium">{comparison.leaseTenantName || "—"}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className={comparison.nameMatch ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                              {comparison.nameMatch ? "Match" : "Mismatch"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 rounded-md border p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Resident Address</p>
                            <p className="font-medium">{comparison.residentAddress || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Lease Address</p>
                            <p className="font-medium">{comparison.leaseAddress || "—"}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className={comparison.addressMatch ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                              {comparison.addressMatch ? "Match" : "Mismatch"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 rounded-md border p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Resident ZIP</p>
                            <p className="font-medium">{comparison.residentZip || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Lease ZIP</p>
                            <p className="font-medium">{comparison.leaseZip || "—"}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className={comparison.zipMatch ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                              {comparison.zipMatch ? "Match" : "Mismatch"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Review Notes</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review decision or exception reason..."
                      className="mt-2 min-h-[150px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Resident Submitted Info</Label>
                    <div className="mt-2 rounded-lg border border-border p-5">
                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-medium">{selectedDoc.residentInfo?.fullName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{selectedDoc.residentInfo?.phone || "—"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">
                            {selectedDoc.residentInfo?.address || "—"}
                            {selectedDoc.residentInfo?.city ? `, ${selectedDoc.residentInfo.city}` : ""}
                            {selectedDoc.residentInfo?.state ? `, ${selectedDoc.residentInfo.state}` : ""}
                            {selectedDoc.residentInfo?.zipCode ? ` ${selectedDoc.residentInfo.zipCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Extracted Lease Info</Label>
                    <div className="mt-2 rounded-lg border border-border p-5">
                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Document Type</p>
                          <p className="font-medium">{selectedDoc.extractedFields?.documentType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tenant Name</p>
                          <p className="font-medium">{selectedDoc.extractedFields?.tenantName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Landlord Name</p>
                          <p className="font-medium">{selectedDoc.extractedFields?.landlordName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lease Start Date</p>
                          <p className="font-medium">{selectedDoc.extractedFields?.leaseStartDate || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lease End Date</p>
                          <p className="font-medium">{selectedDoc.extractedFields?.leaseEndDate || "—"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">
                            {selectedDoc.extractedFields?.address || "—"}
                            {selectedDoc.extractedFields?.city ? `, ${selectedDoc.extractedFields.city}` : ""}
                            {selectedDoc.extractedFields?.state ? `, ${selectedDoc.extractedFields.state}` : ""}
                            {selectedDoc.extractedFields?.zipCode ? ` ${selectedDoc.extractedFields.zipCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setShowRawOcr((prev) => !prev)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">Raw OCR Text</p>
                        <p className="text-xs text-muted-foreground">
                          Expand only if you need the full extracted text from the document.
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {showRawOcr ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showRawOcr && (
                      <div className="border-t border-border p-4">
                        <div className="h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
                          <pre className="whitespace-pre-wrap text-xs font-mono text-foreground">
                            {selectedDoc.ocrText || "No OCR text available for this document."}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={closeReviewDialog}
              disabled={isReviewing || isFlagging}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleFlagException}
              disabled={isReviewing || isFlagging || isReviewedCase || selectedDoc?.isException}
              className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isFlagging ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22V4a2 2 0 0 1 2-2h11l3 3v17l-8-4-8 4z" />
                </svg>
              )}
              {selectedDoc?.isException ? "Already Flagged" : "Flag Exception"}
            </Button>

            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isReviewing || isFlagging || isReviewedCase}
              className="gap-2"
            >
              {isReviewing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
              Reject
            </Button>

            <Button
              onClick={handleApprove}
              disabled={isReviewing || isFlagging || isReviewedCase}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isReviewing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-h-[95vh] max-w-7xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>View Document</DialogTitle>
            <DialogDescription>
              Full-size document viewer for staff review.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[80vh] rounded-lg border border-border bg-muted/20">
            {documentViewerLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            ) : !documentViewerUrl ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Document unavailable
              </div>
            ) : isPdf ? (
              <iframe
                src={documentViewerUrl}
                title="Full document viewer"
                className="h-full w-full"
              />
            ) : (
              <img
                src={documentViewerUrl}
                alt={selectedDoc?.fileName || "Document"}
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}