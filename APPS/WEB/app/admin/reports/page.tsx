"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const BOOKINGS_KEY = "dmv_all_bookings"
const STAFF_ACTIVITY_KEY = "dmv_staff_activity"

interface Appointment {
  id: string
  userId: string
  userName: string
  userEmail: string
  date: string
  time: string
  locationId: string
  locationName: string
  locationAddress: string
  bookedAt: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  staffId?: string
  staffName?: string
  completedAt?: string
}

// Mock report templates
const reportTemplates = [
  {
    id: "daily-summary",
    name: "Daily Summary Report",
    description: "Overview of daily verification activity and key metrics",
    frequency: "Daily",
    lastGenerated: "2024-01-15T06:00:00",
    format: "PDF",
  },
  {
    id: "weekly-analytics",
    name: "Weekly Analytics Report",
    description: "Detailed analytics including trends and performance insights",
    frequency: "Weekly",
    lastGenerated: "2024-01-14T00:00:00",
    format: "PDF",
  },
  {
    id: "monthly-compliance",
    name: "Monthly Compliance Report",
    description: "Compliance status, audit logs, and regulatory adherence",
    frequency: "Monthly",
    lastGenerated: "2024-01-01T00:00:00",
    format: "PDF",
  },
  {
    id: "booking-report",
    name: "Booking Activity Report",
    description: "Appointment bookings, completions, and staff handling metrics",
    frequency: "On-demand",
    lastGenerated: new Date().toISOString(),
    format: "CSV",
  },
  {
    id: "verification-audit",
    name: "Verification Audit Trail",
    description: "Complete audit trail of all verification decisions",
    frequency: "On-demand",
    lastGenerated: "2024-01-12T09:15:00",
    format: "CSV",
  },
  {
    id: "system-health",
    name: "System Health Report",
    description: "Infrastructure performance, uptime, and error logs",
    frequency: "Daily",
    lastGenerated: "2024-01-15T06:00:00",
    format: "PDF",
  },
]

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Appointment[]>([])
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week")
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "templates">("bookings")

  // Load bookings
  useEffect(() => {
    try {
      const bookingsRaw = localStorage.getItem(BOOKINGS_KEY)
      if (bookingsRaw) {
        setBookings(JSON.parse(bookingsRaw))
      }
    } catch {
      // ignore
    }
  }, [])

  // Filter bookings by date range
  const filteredBookings = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.bookedAt || booking.date)
      
      switch (dateRange) {
        case "today":
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          return bookingDate >= today && bookingDate < tomorrow
        case "week":
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return bookingDate >= weekAgo
        case "month":
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return bookingDate >= monthAgo
        default:
          return true
      }
    })
  }, [bookings, dateRange])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredBookings.length
    const completed = filteredBookings.filter((b) => b.status === "completed").length
    const cancelled = filteredBookings.filter((b) => b.status === "cancelled").length
    const noShow = filteredBookings.filter((b) => b.status === "no-show").length
    const scheduled = filteredBookings.filter((b) => b.status === "scheduled").length

    // Group by staff
    const staffMap: Record<string, { name: string; completed: number; noShow: number }> = {}
    filteredBookings.forEach((b) => {
      if (b.staffId && b.staffName) {
        if (!staffMap[b.staffId]) {
          staffMap[b.staffId] = { name: b.staffName, completed: 0, noShow: 0 }
        }
        if (b.status === "completed") staffMap[b.staffId].completed++
        if (b.status === "no-show") staffMap[b.staffId].noShow++
      }
    })

    // Group by location
    const locationMap: Record<string, number> = {}
    filteredBookings.forEach((b) => {
      if (!locationMap[b.locationName]) {
        locationMap[b.locationName] = 0
      }
      locationMap[b.locationName]++
    })

    // Group by date for chart
    const dateMap: Record<string, { scheduled: number; completed: number; cancelled: number }> = {}
    filteredBookings.forEach((b) => {
      const date = new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (!dateMap[date]) {
        dateMap[date] = { scheduled: 0, completed: 0, cancelled: 0 }
      }
      if (b.status === "scheduled") dateMap[date].scheduled++
      if (b.status === "completed") dateMap[date].completed++
      if (b.status === "cancelled") dateMap[date].cancelled++
    })

    return {
      total,
      completed,
      cancelled,
      noShow,
      scheduled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      staffStats: Object.entries(staffMap).map(([id, data]) => ({ id, ...data })),
      locationStats: Object.entries(locationMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      dateStats: Object.entries(dateMap).map(([date, data]) => ({ date, ...data })),
    }
  }, [filteredBookings])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate, schedule, and download operational reports
          </p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["bookings", "overview", "templates"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "bookings" ? "Booking Reports" : tab}
          </button>
        ))}
      </div>

      {/* Booking Reports Tab */}
      {activeTab === "bookings" && (
        <>
          {/* Booking Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.cancelled}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Staff Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Staff Performance</CardTitle>
                <CardDescription>Appointments handled by staff members</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.staffStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    <p className="mt-2 text-sm text-muted-foreground">No staff activity yet</p>
                    <p className="text-xs text-muted-foreground/70">Appointments will show here once handled</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.staffStats.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                            {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">Staff Member</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{staff.completed}</p>
                            <p className="text-[10px] text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-500">{staff.noShow}</p>
                            <p className="text-[10px] text-muted-foreground">No-Show</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bookings by Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bookings by Location</CardTitle>
                <CardDescription>Distribution across DC DMV locations</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.locationStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <p className="mt-2 text-sm text-muted-foreground">No location data yet</p>
                    <p className="text-xs text-muted-foreground/70">Bookings will show here</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.locationStats.map((loc) => (
                      <div key={loc.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          </div>
                          <span className="text-sm text-foreground">{loc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${Math.min((loc.count / Math.max(...stats.locationStats.map((l) => l.count))) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{loc.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <CardDescription>Detailed booking activity log</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <p className="mt-2 text-sm text-muted-foreground">No bookings in this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resident</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Handled By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.slice(0, 10).map((booking) => (
                        <tr key={booking.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{booking.id}</td>
                          <td className="px-3 py-2">
                            <p className="text-sm font-medium text-foreground">{booking.userName}</p>
                            <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-sm text-foreground">{new Date(booking.date).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{booking.time}</p>
                          </td>
                          <td className="px-3 py-2 text-sm text-foreground">{booking.locationName}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                booking.status === "completed"
                                  ? "default"
                                  : booking.status === "scheduled"
                                    ? "outline"
                                    : "secondary"
                              }
                              className={
                                booking.status === "completed"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : booking.status === "no-show"
                                    ? "bg-red-100 text-red-700 hover:bg-red-100"
                                    : ""
                              }
                            >
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-sm text-muted-foreground">
                            {booking.staffName || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Generate Report</p>
                  <p className="text-xs text-muted-foreground">Create custom report</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Schedule Reports</p>
                  <p className="text-xs text-muted-foreground">Set up automated delivery</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Download Archive</p>
                  <p className="text-xs text-muted-foreground">Access past reports</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Templates</CardTitle>
            <CardDescription>Pre-configured report formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.format}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{report.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{report.frequency}</span>
                    <span>Last: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
