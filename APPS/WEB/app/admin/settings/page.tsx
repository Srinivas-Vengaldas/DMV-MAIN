"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure system preferences and administrative options
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General Settings</CardTitle>
          <CardDescription>Basic system configuration options</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" defaultValue="DC Department of Motor Vehicles" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="America/New_York (EST)" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" defaultValue="support@dcdmv.gov" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input id="supportPhone" defaultValue="(202) 555-0100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Settings</CardTitle>
          <CardDescription>Configure system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Email Alerts</span>
              <span className="text-xs text-muted-foreground">Receive alerts for critical system events</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Daily Summary Reports</span>
              <span className="text-xs text-muted-foreground">Get daily verification activity summaries</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Security Alerts</span>
              <span className="text-xs text-muted-foreground">Immediate notification of security events</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">System Maintenance Notices</span>
              <span className="text-xs text-muted-foreground">Advance notice of scheduled maintenance</span>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Settings</CardTitle>
          <CardDescription>Authentication and access control configuration</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Two-Factor Authentication</span>
              <span className="text-xs text-muted-foreground">Require 2FA for all admin accounts</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Session Timeout</span>
              <span className="text-xs text-muted-foreground">Auto-logout after inactivity</span>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="30" className="w-20" />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">IP Allowlist</span>
              <span className="text-xs text-muted-foreground">Restrict admin access to specific IPs</span>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Audit All Actions</span>
              <span className="text-xs text-muted-foreground">Log all administrative actions</span>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configuration</CardTitle>
          <CardDescription>External integration and API settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input type="password" defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxxx" className="font-mono" />
              <Button variant="outline" size="sm">Regenerate</Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this key to authenticate API requests</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Rate Limiting</span>
              <span className="text-xs text-muted-foreground">1000 requests per minute</span>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Webhook Endpoints</span>
              <span className="text-xs text-muted-foreground">3 endpoints configured</span>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-red-800">Clear All Verification Data</span>
              <span className="text-xs text-red-700">Permanently delete all verification records</span>
            </div>
            <Button variant="destructive" size="sm">Clear Data</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-red-800">Reset System Configuration</span>
              <span className="text-xs text-red-700">Reset all settings to factory defaults</span>
            </div>
            <Button variant="destructive" size="sm">Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
