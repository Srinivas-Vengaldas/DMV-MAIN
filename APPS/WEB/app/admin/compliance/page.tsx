"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Mock compliance data
const complianceMetrics = [
  { category: "Data Privacy", score: 98, status: "compliant", lastAudit: "2024-01-10" },
  { category: "Security Standards", score: 95, status: "compliant", lastAudit: "2024-01-08" },
  { category: "Access Controls", score: 100, status: "compliant", lastAudit: "2024-01-12" },
  { category: "Data Retention", score: 92, status: "compliant", lastAudit: "2024-01-05" },
  { category: "Audit Logging", score: 100, status: "compliant", lastAudit: "2024-01-11" },
  { category: "Encryption", score: 100, status: "compliant", lastAudit: "2024-01-09" },
]

const privacyPolicies = [
  { name: "GDPR Compliance", status: "active", lastUpdated: "2024-01-01" },
  { name: "CCPA Compliance", status: "active", lastUpdated: "2024-01-01" },
  { name: "HIPAA Guidelines", status: "not-applicable", lastUpdated: "N/A" },
  { name: "Data Minimization", status: "active", lastUpdated: "2023-12-15" },
  { name: "Right to Erasure", status: "active", lastUpdated: "2024-01-05" },
]

const recentActions = [
  { action: "Privacy Impact Assessment", date: "2024-01-12", status: "completed" },
  { action: "Security Vulnerability Scan", date: "2024-01-10", status: "completed" },
  { action: "Data Retention Review", date: "2024-01-08", status: "completed" },
  { action: "Access Control Audit", date: "2024-01-05", status: "completed" },
  { action: "Encryption Key Rotation", date: "2024-01-03", status: "completed" },
]

export default function CompliancePage() {
  const overallScore = Math.round(
    complianceMetrics.reduce((acc, m) => acc + m.score, 0) / complianceMetrics.length
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor regulatory compliance, privacy policies, and security standards
        </p>
      </div>

      {/* Overall Compliance Score */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-green-800">{overallScore}%</h2>
              <p className="text-sm text-green-700">Overall Compliance Score</p>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">Fully Compliant</Badge>
        </CardContent>
      </Card>

      {/* Compliance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Metrics</CardTitle>
          <CardDescription>Detailed breakdown by compliance category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {complianceMetrics.map((metric) => (
              <div
                key={metric.category}
                className="flex flex-col gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.category}</span>
                  <Badge
                    variant="secondary"
                    className={
                      metric.score >= 95
                        ? "bg-green-100 text-green-700"
                        : metric.score >= 80
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    {metric.score}%
                  </Badge>
                </div>
                <Progress value={metric.score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Last audited: {new Date(metric.lastAudit).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Privacy Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy Policies</CardTitle>
            <CardDescription>Active regulatory compliance policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {privacyPolicies.map((policy) => (
                <div
                  key={policy.name}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{policy.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Updated: {policy.lastUpdated}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      policy.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {policy.status === "active" ? "Active" : "N/A"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Compliance Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Actions</CardTitle>
            <CardDescription>Latest compliance-related activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {recentActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{action.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(action.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 capitalize">
                    {action.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Subject Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Data Subject Requests</CardTitle>
            <CardDescription>Manage GDPR/CCPA data requests</CardDescription>
          </div>
          <Button size="sm" variant="outline">View All Requests</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Access Requests</span>
                <Badge variant="secondary">3 Pending</Badge>
              </div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deletion Requests</span>
                <Badge variant="secondary">1 Pending</Badge>
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Portability Requests</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">All Complete</Badge>
              </div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
