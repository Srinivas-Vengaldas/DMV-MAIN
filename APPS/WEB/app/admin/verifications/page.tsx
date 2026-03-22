"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DOC_STATUS_KEY = "dmv_document_status"
const SUPPORT_REQUESTS_KEY = "dmv_support_requests"
const VERIFICATION_QUEUE_KEY = "dmv_verification_queue"
const USERS_KEY = "dmv_users"

interface VerificationRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  documentType: string
  fileName: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  aiConfidence: number
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
  isStaffReview?: boolean
}

interface SupportRequest {
  id: string
  type: string
  documentType: string
  fileName: string
  requestedAt: string
  status: string
  userNote: string
  userId?: string
  userName?: string
  userEmail?: string
}

const statusFilters = ["all", "pending", "approved", "rejected"]

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([])
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load verification requests from localStorage
  const loadVerifications = () => {
    try {
      // Load verification queue
      const queueRaw = localStorage.getItem(VERIFICATION_QUEUE_KEY)
      const queue: VerificationRequest[] = queueRaw ? JSON.parse(queueRaw) : []
      
      // Load support requests
      const supportRaw = localStorage.getItem(SUPPORT_REQUESTS_KEY)
      const support: SupportRequest[] = supportRaw ? JSON.parse(supportRaw) : []
      
      // Load the current document status to check for pending verifications
      const docStatusRaw = localStorage.getItem(DOC_STATUS_KEY)
      if (docStatusRaw) {
        const docStatus = JSON.parse(docStatusRaw)
        const lease = docStatus.leaseDocument
        
        if (lease?.verifying || lease?.supportRequested) {
          // Check if this verification already exists in queue
          const existsInQueue = queue.some(v => v.fileName === lease.fileName && v.status === "pending")
          
          if (!existsInQueue) {
            // Add to verification queue
            const newVerification: VerificationRequest = {
              id: `VER-${Date.now()}`,
              userId: "current-user",
              userName: "Current User",
              userEmail: "user@email.com",
              documentType: "Lease Document",
              fileName: lease.fileName || "Unknown Document",
              status: "pending",
              submittedAt: lease.submittedAt || lease.uploadedAt || new Date().toISOString(),
              aiConfidence: Math.random() * 0.4 + 0.5, // 50-90% confidence
              isStaffReview: !!lease.supportRequested,
            }
            queue.push(newVerification)
            localStorage.setItem(VERIFICATION_QUEUE_KEY, JSON.stringify(queue))
          }
        }
      }
      
      setVerifications(queue)
      setSupportRequests(support.filter(s => s.status === "pending"))
    } catch {
      setVerifications([])
      setSupportRequests([])
    }
  }

  useEffect(() => {
    loadVerifications()
    // Poll for new verifications
    const interval = setInterval(loadVerifications, 2000)
    return () => clearInterval(interval)
  }, [])

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch = 
      v.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = verifications.filter(v => v.status === "pending").length
  const approvedCount = verifications.filter(v => v.status === "approved").length
  const rejectedCount = verifications.filter(v => v.status === "rejected").length

  // Approve verification
  const handleApprove = (verification: VerificationRequest) => {
    setIsProcessing(true)
    
    setTimeout(() => {
      // Update verification queue
      const updatedQueue = verifications.map(v => {
        if (v.id === verification.id) {
          return {
            ...v,
            status: "approved" as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: "Admin",
          }
        }
        return v
      })
      localStorage.setItem(VERIFICATION_QUEUE_KEY, JSON.stringify(updatedQueue))
      setVerifications(updatedQueue)
      
      // Update the resident's document status
      try {
        const docStatusRaw = localStorage.getItem(DOC_STATUS_KEY)
        if (docStatusRaw) {
          const docStatus = JSON.parse(docStatusRaw)
          if (docStatus.leaseDocument?.fileName === verification.fileName) {
            docStatus.leaseDocument = {
              ...docStatus.leaseDocument,
              verified: true,
              verifying: false,
              rejected: false,
              supportRequested: false,
              verifiedAt: new Date().toISOString(),
              verifiedBy: "Admin",
            }
            localStorage.setItem(DOC_STATUS_KEY, JSON.stringify(docStatus))
          }
        }
        
        // Remove from support requests if applicable
        const supportRaw = localStorage.getItem(SUPPORT_REQUESTS_KEY)
        if (supportRaw) {
          const support = JSON.parse(supportRaw)
          const updatedSupport = support.filter((s: SupportRequest) => s.fileName !== verification.fileName)
          localStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(updatedSupport))
        }
      } catch {
        // ignore
      }
      
      setIsProcessing(false)
      setIsPreviewOpen(false)
      setSelectedVerification(null)
    }, 500)
  }

  // Reject verification
  const handleReject = (verification: VerificationRequest) => {
    setIsProcessing(true)
    
    setTimeout(() => {
      // Update verification queue
      const updatedQueue = verifications.map(v => {
        if (v.id === verification.id) {
          return {
            ...v,
            status: "rejected" as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: "Admin",
            rejectionReason: "Document could not be verified. Please upload a clearer document.",
          }
        }
        return v
      })
      localStorage.setItem(VERIFICATION_QUEUE_KEY, JSON.stringify(updatedQueue))
      setVerifications(updatedQueue)
      
      // Update the resident's document status
      try {
        const docStatusRaw = localStorage.getItem(DOC_STATUS_KEY)
        if (docStatusRaw) {
          const docStatus = JSON.parse(docStatusRaw)
          if (docStatus.leaseDocument?.fileName === verification.fileName) {
            docStatus.leaseDocument = {
              ...docStatus.leaseDocument,
              verified: false,
              verifying: false,
              rejected: true,
              supportRequested: false,
              rejectedAt: new Date().toISOString(),
              rejectedBy: "Admin",
              rejectionReason: "Document could not be verified. Please upload a clearer document.",
            }
            localStorage.setItem(DOC_STATUS_KEY, JSON.stringify(docStatus))
          }
        }
        
        // Remove from support requests if applicable
        const supportRaw = localStorage.getItem(SUPPORT_REQUESTS_KEY)
        if (supportRaw) {
          const support = JSON.parse(supportRaw)
          const updatedSupport = support.filter((s: SupportRequest) => s.fileName !== verification.fileName)
          localStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(updatedSupport))
        }
      } catch {
        // ignore
      }
      
      setIsProcessing(false)
      setIsPreviewOpen(false)
      setSelectedVerification(null)
    }, 500)
  }

  const openPreview = (verification: VerificationRequest) => {
    setSelectedVerification(verification)
    setIsPreviewOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Verification Management</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage document verification requests from residents
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{verifications.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Review Alert */}
      {supportRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Staff Review Requested</p>
              <p className="text-xs text-amber-700">{supportRequests.length} document(s) require manual staff review</p>
            </div>
            <Badge variant="secondary" className="bg-amber-200 text-amber-800">
              {supportRequests.length} Pending
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {statusFilters.map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  className={`cursor-pointer capitalize ${
                    statusFilter === status ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Requests</CardTitle>
          <CardDescription>
            {filteredVerifications.length} verification{filteredVerifications.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredVerifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <p className="mt-4 text-sm text-muted-foreground">No verification requests found</p>
              <p className="text-xs text-muted-foreground">Requests will appear here when residents submit documents for verification</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    verification.isStaffReview ? "border-amber-200 bg-amber-50/50" : "border-border"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{verification.fileName}</span>
                      <Badge
                        variant="secondary"
                        className={
                          verification.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : verification.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }
                      >
                        {verification.status}
                      </Badge>
                      {verification.isStaffReview && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Staff Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{verification.userEmail}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{verification.id}</span>
                      <span>{verification.documentType}</span>
                      <span>{new Date(verification.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">AI Confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              verification.aiConfidence >= 0.8
                                ? "bg-green-500"
                                : verification.aiConfidence >= 0.6
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${verification.aiConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(verification.aiConfidence * 100)}%</span>
                      </div>
                    </div>
                    {verification.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleApprove(verification)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleReject(verification)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openPreview(verification)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Review the submitted document and verification details
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="flex flex-col gap-4 py-4">
              {/* Document Info */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedVerification.fileName}</p>
                    <p className="text-xs text-muted-foreground">{selectedVerification.documentType}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      selectedVerification.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : selectedVerification.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }
                  >
                    {selectedVerification.status}
                  </Badge>
                </div>
              </div>
              
              {/* Document Preview Placeholder */}
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p className="mt-2 text-sm text-muted-foreground">Document Preview</p>
                  <p className="text-xs text-muted-foreground">(Actual file content would appear here)</p>
                </div>
              </div>

              {/* Verification Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Request ID</p>
                  <p className="font-medium">{selectedVerification.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(selectedVerification.submittedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedVerification.userName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI Confidence</p>
                  <p className="font-medium">{Math.round(selectedVerification.aiConfidence * 100)}%</p>
                </div>
              </div>

              {selectedVerification.isStaffReview && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">Staff Review Requested</p>
                  <p className="text-xs text-amber-700">This document requires manual staff verification as it could not be automatically verified.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedVerification?.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => selectedVerification && handleReject(selectedVerification)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => selectedVerification && handleApprove(selectedVerification)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Approve Document"}
                </Button>
              </>
            )}
            {selectedVerification?.status !== "pending" && (
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
