"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Mock system status data
const services = [
  { name: "Web Application", status: "operational", uptime: 99.99, latency: 45 },
  { name: "AI Verification Engine", status: "operational", uptime: 99.95, latency: 230 },
  { name: "Database (Primary)", status: "operational", uptime: 99.99, latency: 12 },
  { name: "Database (Replica)", status: "operational", uptime: 99.98, latency: 15 },
  { name: "File Storage", status: "operational", uptime: 99.97, latency: 78 },
  { name: "Authentication Service", status: "operational", uptime: 99.99, latency: 35 },
  { name: "Email Service", status: "degraded", uptime: 98.50, latency: 450 },
  { name: "Background Jobs", status: "operational", uptime: 99.90, latency: 120 },
]

const recentIncidents = [
  { date: "2024-01-10", title: "Email Service Degradation", duration: "2h 15m", status: "resolved" },
  { date: "2024-01-05", title: "AI Engine High Latency", duration: "45m", status: "resolved" },
  { date: "2023-12-28", title: "Scheduled Maintenance", duration: "4h", status: "completed" },
]

export default function SystemStatusPage() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const operationalCount = services.filter(s => s.status === "operational").length
  const degradedCount = services.filter(s => s.status === "degraded").length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">System Status</h1>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of all system services and infrastructure
        </p>
      </div>

      {/* Overall Status */}
      <Card className={degradedCount > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
              degradedCount > 0 ? "bg-amber-100" : "bg-green-100"
            }`}>
              {degradedCount > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${degradedCount > 0 ? "text-amber-800" : "text-green-800"}`}>
                {degradedCount > 0 ? "Partial Degradation" : "All Systems Operational"}
              </h2>
              <p className={`text-sm ${degradedCount > 0 ? "text-amber-700" : "text-green-700"}`}>
                {operationalCount} of {services.length} services running normally
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium">{currentTime.toLocaleTimeString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Status</CardTitle>
          <CardDescription>Current status of all system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {services.map((service) => (
              <div
                key={service.name}
                className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  service.status === "degraded" ? "border-amber-200 bg-amber-50" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    service.status === "operational" ? "bg-green-500" : "bg-amber-500"
                  }`} />
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{service.uptime}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className={`font-medium ${
                      service.latency > 200 ? "text-amber-600" : "text-green-600"
                    }`}>{service.latency}ms</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      service.status === "operational"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Usage</CardTitle>
            <CardDescription>Current infrastructure utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">42%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Usage</span>
                  <span className="text-sm text-muted-foreground">54%</span>
                </div>
                <Progress value={54} className="h-2" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network Bandwidth</span>
                  <span className="text-sm text-muted-foreground">28%</span>
                </div>
                <Progress value={28} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Incidents</CardTitle>
            <CardDescription>Past 30 days incident history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {recentIncidents.map((incident, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{incident.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(incident.date).toLocaleDateString()} • Duration: {incident.duration}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      incident.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uptime Summary (Last 90 Days)</CardTitle>
          <CardDescription>Historical uptime across all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 90 }).map((_, i) => {
              const isRecent = i > 80
              const hasIssue = i === 85 || i === 70 || i === 62
              return (
                <div
                  key={i}
                  className={`h-8 w-1.5 rounded-full ${
                    hasIssue ? "bg-amber-400" : isRecent ? "bg-green-500" : "bg-green-400"
                  }`}
                  title={`Day ${90 - i}`}
                />
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>90 days ago</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span>No issues</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-amber-400" />
                <span>Degraded</span>
              </div>
            </div>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
