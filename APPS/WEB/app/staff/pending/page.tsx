"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  isStaffReview: boolean
}

export default function PendingCasesPage() {
  const [queue, setQueue] = useState<VerificationRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date")
  const [isLoading, setIsLoading] = useState(true)

  const loadQueue = useCallback(async () => {
    try {
      setIsLoading(true)

      const res = await fetch("/api/staff/verifications", {
        credentials: "include",
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load pending cases")
      }

      setQueue(data.verifications || [])
    } catch (error) {
      console.error("Failed to load pending cases:", error)
      setQueue([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const pendingCases = useMemo(() => {
    return queue
      .filter((v) => v.status === "pending")
      .filter((v) =>
        v.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "confidence") {
          return a.aiConfidence - b.aiConfidence
        }
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      })
  }, [queue, searchQuery, sortBy])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Pending Cases</h1>
        <p className="text-sm text-muted-foreground">
          All documents awaiting staff review
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("date")}
              >
                Sort by Date
              </Button>
              <Button
                variant={sortBy === "confidence" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("confidence")}
              >
                Sort by Confidence
              </Button>
            </div>

            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Pending Cases</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading pending cases..."
              : `${pendingCases.length} case${pendingCases.length !== 1 ? "s" : ""} waiting for review`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">Loading pending cases...</p>
            </div>
          ) : pendingCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="mt-4 text-sm font-medium text-muted-foreground">No pending cases</p>
              <p className="mt-1 text-xs text-muted-foreground">All cases have been processed</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingCases.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    item.isStaffReview ? "border-red-200 bg-red-50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        item.isStaffReview ? "bg-red-100" : "bg-amber-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.isStaffReview ? "text-red-600" : "text-amber-600"}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.documentType}</p>
                        {item.isStaffReview && (
                          <Badge variant="destructive" className="text-[10px]">
                            Staff Review
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">{item.userName}</p>
                      <p className="text-xs text-muted-foreground">{item.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Waiting {Math.max(0, Math.floor((Date.now() - new Date(item.submittedAt).getTime()) / (1000 * 60)))} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`${
                        item.aiConfidence >= 0.8
                          ? "bg-green-100 text-green-700"
                          : item.aiConfidence >= 0.6
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {Math.round(item.aiConfidence * 100)}% AI
                    </Badge>

                    <Link href={`/staff/review?case=${item.caseNumber}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}