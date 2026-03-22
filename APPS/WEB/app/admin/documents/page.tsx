"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Mock document types configuration
const documentTypes = [
  {
    id: "lease",
    name: "Lease Document",
    description: "Residential lease agreements and rental contracts",
    enabled: true,
    aiVerification: true,
    requiredFields: ["Tenant Name", "Property Address", "Lease Term", "Signature"],
    confidenceThreshold: 0.85,
  },
  {
    id: "utility",
    name: "Utility Bill",
    description: "Electric, gas, water, or internet service bills",
    enabled: true,
    aiVerification: true,
    requiredFields: ["Account Holder", "Service Address", "Bill Date", "Amount"],
    confidenceThreshold: 0.80,
  },
  {
    id: "bank",
    name: "Bank Statement",
    description: "Monthly bank account statements",
    enabled: true,
    aiVerification: true,
    requiredFields: ["Account Holder", "Account Number", "Statement Period", "Address"],
    confidenceThreshold: 0.90,
  },
  {
    id: "tax",
    name: "Tax Document",
    description: "W-2, 1099, or property tax statements",
    enabled: false,
    aiVerification: false,
    requiredFields: ["Taxpayer Name", "Tax Year", "Address"],
    confidenceThreshold: 0.95,
  },
]

export default function DocumentsConfigPage() {
  const [docs, setDocs] = useState(documentTypes)

  const toggleEnabled = (id: string) => {
    setDocs(docs.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d))
  }

  const toggleAI = (id: string) => {
    setDocs(docs.map(d => d.id === id ? { ...d, aiVerification: !d.aiVerification } : d))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Document Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure document types, verification rules, and AI processing settings
        </p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Settings</CardTitle>
          <CardDescription>System-wide document processing configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxSize">Maximum File Size (MB)</Label>
              <Input id="maxSize" type="number" defaultValue="10" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="formats">Allowed Formats</Label>
              <Input id="formats" defaultValue="PDF, PNG, JPG, JPEG" className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="retention">Data Retention (Days)</Label>
              <Input id="retention" type="number" defaultValue="365" className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Model Configuration</CardTitle>
          <CardDescription>Configure AI verification engine settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">AI Model Version</span>
                <span className="text-xs text-muted-foreground">Current: v2.4.1</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Auto-Approval</span>
                <span className="text-xs text-muted-foreground">For high-confidence results</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Fallback to Staff Review</span>
                <span className="text-xs text-muted-foreground">When AI confidence is low</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Document OCR</span>
                <span className="text-xs text-muted-foreground">Extract text from images</span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Document Types</CardTitle>
            <CardDescription>Configure accepted document categories</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Document Type
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`rounded-lg border p-4 transition-colors ${
                  doc.enabled ? "border-border bg-background" : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{doc.name}</h3>
                      {doc.enabled ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">Disabled</Badge>
                      )}
                      {doc.aiVerification && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">AI Enabled</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.requiredFields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      AI Confidence Threshold: {Math.round(doc.confidenceThreshold * 100)}%
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={doc.enabled}
                        onCheckedChange={() => toggleEnabled(doc.id)}
                      />
                      <Label className="text-xs">Enable</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={doc.aiVerification}
                        onCheckedChange={() => toggleAI(doc.id)}
                        disabled={!doc.enabled}
                      />
                      <Label className="text-xs">AI Verify</Label>
                    </div>
                    <Button size="sm" variant="ghost" className="justify-start gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
