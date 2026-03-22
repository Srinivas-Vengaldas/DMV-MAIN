"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Mock audit log data
const mockAuditLogs = [
  { id: "AUD-001", action: "User Login", actor: "admin@dcdmv.gov", target: "System", timestamp: "2024-01-15T10:30:00", ip: "192.168.1.100", status: "success" },
  { id: "AUD-002", action: "Document Approved", actor: "staff@dcdmv.gov", target: "VER-2024-002", timestamp: "2024-01-15T10:25:00", ip: "192.168.1.101", status: "success" },
  { id: "AUD-003", action: "User Created", actor: "admin@dcdmv.gov", target: "john.smith@email.com", timestamp: "2024-01-15T10:20:00", ip: "192.168.1.100", status: "success" },
  { id: "AUD-004", action: "Document Rejected", actor: "AI Agent", target: "VER-2024-004", timestamp: "2024-01-15T10:15:00", ip: "System", status: "success" },
  { id: "AUD-005", action: "Config Changed", actor: "admin@dcdmv.gov", target: "AI Confidence Threshold", timestamp: "2024-01-15T10:10:00", ip: "192.168.1.100", status: "success" },
  { id: "AUD-006", action: "Failed Login", actor: "unknown@email.com", target: "System", timestamp: "2024-01-15T10:05:00", ip: "203.0.113.45", status: "failed" },
  { id: "AUD-007", action: "Report Exported", actor: "admin@dcdmv.gov", target: "Monthly Report", timestamp: "2024-01-15T10:00:00", ip: "192.168.1.100", status: "success" },
  { id: "AUD-008", action: "User Deactivated", actor: "admin@dcdmv.gov", target: "old.user@email.com", timestamp: "2024-01-15T09:55:00", ip: "192.168.1.100", status: "success" },
]

const actionTypes = ["all", "login", "document", "user", "config", "report"]

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesAction = true
    if (actionFilter !== "all") {
      const actionMap: Record<string, string[]> = {
        login: ["User Login", "Failed Login"],
        document: ["Document Approved", "Document Rejected"],
        user: ["User Created", "User Deactivated"],
        config: ["Config Changed"],
        report: ["Report Exported"],
      }
      matchesAction = actionMap[actionFilter]?.some(a => log.action.includes(a)) ?? false
    }
    
    return matchesSearch && matchesAction
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Track all system activities, user actions, and security events
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <div>
              <p className="text-xl font-bold">2,456</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p className="text-xl font-bold">2,398</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <p className="text-xl font-bold">58</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div>
              <p className="text-xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Security Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {actionTypes.map((action) => (
                <Badge
                  key={action}
                  variant={actionFilter === action ? "default" : "outline"}
                  className={`cursor-pointer capitalize ${
                    actionFilter === action ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => setActionFilter(action)}
                >
                  {action}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button size="sm" variant="outline" className="gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  log.status === "failed" ? "border-red-200 bg-red-50" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    log.status === "success" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {log.status === "success" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{log.action}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{log.actor}</span>
                      <span>{"→"}</span>
                      <span>{log.target}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{log.ip}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="font-mono text-muted-foreground/70">{log.id}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
