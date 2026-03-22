"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

interface StaffActivity {
  id: string
  caseNumber?: string
  staffId: string
  staffName: string
  action: "approved" | "rejected" | "note_added"
  verificationId: string
  documentType: string
  userName?: string
  timestamp: string
  notes?: string
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ActivityPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<StaffActivity[]>([])
  const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "note_added">("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setIsLoading(true)

      const res = await fetch("/api/staff/activity", {
        credentials: "include",
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load activity")
      }

      setActivities(data.activities || [])
    } catch (error) {
      console.error("Failed to load activity:", error)
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  const setPresetToday = () => {
    const today = toDateInputValue(new Date())
    setStartDate(today)
    setEndDate(today)
  }

  const setPresetLast7Days = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    setStartDate(toDateInputValue(start))
    setEndDate(toDateInputValue(end))
  }

  const setPresetLast30Days = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29)
    setStartDate(toDateInputValue(start))
    setEndDate(toDateInputValue(end))
  }

  const clearDateFilter = () => {
    setStartDate("")
    setEndDate("")
  }

  const myActivities = useMemo(() => {
    return activities
      .filter((a) => a.staffId === user?.id)
      .filter((a) => filter === "all" || a.action === filter)
      .filter((a) => {
        const activityDate = new Date(a.timestamp)

        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`)
          if (activityDate < start) return false
        }

        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`)
          if (activityDate > end) return false
        }

        return true
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [activities, user?.id, filter, startDate, endDate])

  const totalCount = myActivities.length
  const todayCount = myActivities.filter(
    (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
  ).length
  const approvedCount = myActivities.filter((a) => a.action === "approved").length
  const rejectedCount = myActivities.filter((a) => a.action === "rejected").length

  const handleExportReport = () => {
    const rows = [
      [
        "Case Number",
        "Action",
        "Resident Name",
        "Document Type",
        "Verification ID",
        "Timestamp",
        "Notes",
      ],
      ...myActivities.map((activity) => [
        activity.caseNumber || "",
        activity.action,
        activity.userName || "",
        activity.documentType || "",
        activity.verificationId,
        new Date(activity.timestamp).toLocaleString(),
        activity.notes || "",
      ]),
    ]

    const suffix =
      startDate || endDate
        ? `${startDate || "start"}_to_${endDate || "end"}`
        : "all_dates"

    downloadCsv(`staff-activity-report-${suffix}.csv`, rows)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">My Activity</h1>
        <p className="text-sm text-muted-foreground">
          Track your review history, filter by date, and export reports
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Filtered Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("approved")}
                className={filter === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Approved
              </Button>
              <Button
                variant={filter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("rejected")}
                className={filter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Rejected
              </Button>
              <Button
                variant={filter === "note_added" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("note_added")}
                className={filter === "note_added" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Notes
              </Button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end gap-2 sm:col-span-2">
                  <Button type="button" variant="outline" size="sm" onClick={setPresetToday}>
                    Today
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={setPresetLast7Days}>
                    Last 7 Days
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={setPresetLast30Days}>
                    Last 30 Days
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearDateFilter}>
                    Clear
                  </Button>
                </div>
              </div>

              <div>
                <Button onClick={handleExportReport} disabled={myActivities.length === 0}>
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review History</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading activity..."
              : `${myActivities.length} activit${myActivities.length !== 1 ? "ies" : "y"} found`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">Loading activity...</p>
            </div>
          ) : myActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <p className="mt-4 text-sm font-medium text-muted-foreground">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Start reviewing documents to see your activity here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myActivities.map((activity) => {
                const isExpanded = expandedId === activity.id

                return (
                  <div
                    key={activity.id}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      activity.action === "approved"
                        ? "border-green-200 bg-green-50"
                        : activity.action === "rejected"
                          ? "border-red-200 bg-red-50"
                          : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            activity.action === "approved"
                              ? "bg-green-100"
                              : activity.action === "rejected"
                                ? "bg-red-100"
                                : "bg-blue-100"
                          }`}
                        >
                          {activity.action === "approved" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : activity.action === "rejected" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {activity.caseNumber && (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                {activity.caseNumber}
                              </Badge>
                            )}
                            <p className="text-sm font-semibold capitalize">
                              {activity.action.replace("_", " ")}
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              {activity.documentType}
                            </Badge>
                          </div>

                          {activity.userName && (
                            <p className="mt-1 text-sm text-foreground">
                              Resident: <span className="font-medium">{activity.userName}</span>
                            </p>
                          )}

                          {activity.notes && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              Note: {activity.notes}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {isExpanded ? "Hide details" : "View details"}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 rounded-md border border-border/60 bg-background/70 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Case Number</p>
                            <p className="text-sm font-medium">{activity.caseNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Resident Name</p>
                            <p className="text-sm font-medium">{activity.userName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Document Type</p>
                            <p className="text-sm font-medium">{activity.documentType || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Action</p>
                            <p className="text-sm font-medium capitalize">
                              {activity.action.replace("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Verification ID</p>
                            <p className="break-all text-sm font-medium">{activity.verificationId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Open Case</p>
                            {activity.caseNumber ? (
                              <Link href={`/staff/review?case=${activity.caseNumber}`}>
                                <Button size="sm" variant="outline" className="mt-1">
                                  Open Review
                                </Button>
                              </Link>
                            ) : (
                              <p className="text-sm font-medium">—</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">Staff Note</p>
                            <div className="mt-1 rounded-md bg-muted/50 p-3">
                              <p className="text-sm text-foreground">
                                {activity.notes || "No note added for this review."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}