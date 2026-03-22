"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock analytics data
const weeklyData = [
  { day: "Mon", verifications: 234, approvals: 221, rejections: 13 },
  { day: "Tue", verifications: 287, approvals: 270, rejections: 17 },
  { day: "Wed", verifications: 312, approvals: 294, rejections: 18 },
  { day: "Thu", verifications: 289, approvals: 273, rejections: 16 },
  { day: "Fri", verifications: 345, approvals: 325, rejections: 20 },
  { day: "Sat", verifications: 156, approvals: 148, rejections: 8 },
  { day: "Sun", verifications: 98, approvals: 94, rejections: 4 },
]

const documentTypeStats = [
  { type: "Lease Documents", count: 8234, percentage: 52 },
  { type: "Utility Bills", count: 4123, percentage: 26 },
  { type: "Bank Statements", count: 2456, percentage: 16 },
  { type: "Other", count: 987, percentage: 6 },
]

const processingTimes = [
  { range: "< 1s", count: 4523, percentage: 29 },
  { range: "1-2s", count: 6234, percentage: 40 },
  { range: "2-3s", count: 3456, percentage: 22 },
  { range: "3-5s", count: 1234, percentage: 8 },
  { range: "> 5s", count: 156, percentage: 1 },
]

const hourlyTraffic = [
  { hour: "6 AM", count: 45 },
  { hour: "8 AM", count: 234 },
  { hour: "10 AM", count: 456 },
  { hour: "12 PM", count: 523 },
  { hour: "2 PM", count: 487 },
  { hour: "4 PM", count: 398 },
  { hour: "6 PM", count: 234 },
  { hour: "8 PM", count: 123 },
]

export default function AnalyticsPage() {
  const maxVerifications = Math.max(...weeklyData.map(d => d.verifications))
  const maxTraffic = Math.max(...hourlyTraffic.map(d => d.count))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Detailed metrics and performance analysis of verification operations
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="cursor-pointer bg-primary text-primary-foreground">Last 7 Days</Badge>
        <Badge variant="outline" className="cursor-pointer">Last 30 Days</Badge>
        <Badge variant="outline" className="cursor-pointer">Last 90 Days</Badge>
        <Badge variant="outline" className="cursor-pointer">Custom Range</Badge>
      </div>

      {/* Weekly Verification Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Verification Trend</CardTitle>
          <CardDescription>Daily breakdown of verification activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Simple bar chart */}
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-col items-center gap-1">
                    <div
                      className="w-full max-w-12 rounded-t bg-green-500"
                      style={{ height: `${(day.approvals / maxVerifications) * 160}px` }}
                    />
                    <div
                      className="w-full max-w-12 rounded-b bg-red-400"
                      style={{ height: `${(day.rejections / maxVerifications) * 160}px` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-xs text-muted-foreground">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-400" />
                <span className="text-xs text-muted-foreground">Rejected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Document Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Type Distribution</CardTitle>
            <CardDescription>Breakdown by document category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {documentTypeStats.map((doc) => (
                <div key={doc.type} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{doc.type}</span>
                    <span className="text-sm text-muted-foreground">{doc.count.toLocaleString()} ({doc.percentage}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${doc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Time Distribution</CardTitle>
            <CardDescription>Time taken for AI verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {processingTimes.map((time) => (
                <div key={time.range} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{time.range}</span>
                    <span className="text-sm text-muted-foreground">{time.count.toLocaleString()} ({time.percentage}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        time.range === "< 1s" || time.range === "1-2s" 
                          ? "bg-green-500" 
                          : time.range === "2-3s" 
                            ? "bg-amber-500" 
                            : "bg-red-500"
                      }`}
                      style={{ width: `${time.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Traffic Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hourly Traffic Pattern</CardTitle>
          <CardDescription>Verification requests by time of day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {hourlyTraffic.map((hour) => (
              <div key={hour.hour} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-16 rounded-t bg-primary/80"
                  style={{ height: `${(hour.count / maxTraffic) * 120}px` }}
                />
                <span className="text-xs font-medium text-muted-foreground">{hour.hour}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
          <CardDescription>AI-generated analysis of current trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-green-600"><path d="m5 12 5 5L20 7"/></svg>
              <div>
                <p className="text-sm font-medium text-green-800">High Approval Rate</p>
                <p className="text-xs text-green-700">94.2% approval rate exceeds target of 90%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Peak Hours Identified</p>
                <p className="text-xs text-amber-700">12 PM - 2 PM shows 40% higher traffic</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-blue-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Lease Documents Lead</p>
                <p className="text-xs text-blue-700">52% of all verifications are lease documents</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
