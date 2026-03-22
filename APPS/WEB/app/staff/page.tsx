"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface VerificationRequest {
  id: string;
  caseNumber?: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  fileName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  aiConfidence: number;
  isStaffReview: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

interface StaffActivity {
  id: string;
  staffId: string;
  action: "approved" | "rejected" | "note_added";
  verificationId: string;
  caseNumber?: string;
  documentType: string;
  userName?: string;
  timestamp: string;
  notes?: string;
}

interface DashboardResponse {
  counts: {
    pending: number;
    staffReview: number;
    lowConfidence: number;
    reviewedToday: number;
  };
  recentPending: VerificationRequest[];
  recentActivity: StaffActivity[];
}

export default function StaffDashboardPage() {
  const { user } = useAuth();
const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
  
      const res = await fetch("/api/staff/dashboard", {
        credentials: "include",
        cache: "no-store",
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load dashboard");
      }
  
      setDashboard(data.dashboard);
    } catch (error) {
      console.error("Failed to load staff dashboard:", error);
      if (!silent) {
        setDashboard({
          counts: {
            pending: 0,
            staffReview: 0,
            lowConfidence: 0,
            reviewedToday: 0,
          },
          recentPending: [],
          recentActivity: [],
        });
      }
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard(false);
  
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 15000);
  
    return () => clearInterval(interval);
  }, [loadDashboard])

  const pendingCount = dashboard?.counts?.pending ?? 0;
  const staffReviewCount = dashboard?.counts?.staffReview ?? 0;
  const lowConfidenceCount = dashboard?.counts?.lowConfidence ?? 0;
  const todayReviewed = dashboard?.counts?.reviewedToday ?? 0;
  const recentPending = dashboard?.recentPending ?? [];
  const myRecentActivity = dashboard?.recentActivity ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Staff Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.firstName}. Review and verify resident documents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{staffReviewCount}</p>
              <p className="text-sm text-muted-foreground">Staff Review Needed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{lowConfidenceCount}</p>
              <p className="text-sm text-muted-foreground">Low Confidence</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{todayReviewed}</p>
              <p className="text-sm text-muted-foreground">Reviewed Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {staffReviewCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {staffReviewCount} document(s) require manual staff review
            </p>
            <p className="text-xs text-red-600">
              These documents were flagged by AI verification and need human review.
            </p>
          </div>
          <Link href="/staff/review">
            <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Pending</CardTitle>
              <CardDescription>Documents awaiting review</CardDescription>
            </div>
            <Link href="/staff/review">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : recentPending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                <p className="mt-3 text-sm text-muted-foreground">No pending reviews</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentPending.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.isStaffReview ? "bg-red-100" : "bg-amber-100"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.isStaffReview ? "text-red-600" : "text-amber-600"}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-primary">
                            {item.caseNumber || "No Case ID"}
                          </p>
                          <p className="text-sm font-medium">{item.documentType}</p>
                          <p className="text-xs text-muted-foreground">{item.userName}</p>
                          <p className="text-xs text-muted-foreground">{item.fileName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.isStaffReview && (
                          <Badge variant="destructive" className="text-[10px]">Staff Review</Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            item.aiConfidence < 0.7
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {Math.round(item.aiConfidence * 100)}% AI
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/staff/review?case=${item.caseNumber}`}>
                        <Button size="sm">Open Review</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">My Recent Activity</CardTitle>
              <CardDescription>Your review history</CardDescription>
            </div>
            <Link href="/staff/activity">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : myRecentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p className="mt-3 text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.action === "approved" ? "bg-green-100" : activity.action === "rejected" ? "bg-red-100" : "bg-blue-100"}`}>
                      {activity.action === "approved" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : activity.action === "rejected" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      )}
                    </div>
                    <div className="flex-1">
                      {activity.caseNumber && (
                        <p className="text-xs font-semibold text-primary">{activity.caseNumber}</p>
                      )}
                      <p className="text-sm font-medium capitalize">{activity.action.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{activity.documentType}</p>
                      {activity.userName && (
                        <p className="text-xs text-muted-foreground">{activity.userName}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/staff/review">
              <Button variant="outline" className="h-auto w-full justify-start gap-2 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                <div className="text-left">
                  <p className="font-medium">Review Documents</p>
                  <p className="text-xs text-muted-foreground">Process pending verifications</p>
                </div>
              </Button>
            </Link>

            <Link href="/staff/pending">
              <Button variant="outline" className="h-auto w-full justify-start gap-2 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div className="text-left">
                  <p className="font-medium">Pending Cases</p>
                  <p className="text-xs text-muted-foreground">View all waiting reviews</p>
                </div>
              </Button>
            </Link>

            <Link href="/staff/exceptions">
              <Button variant="outline" className="h-auto w-full justify-start gap-2 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div className="text-left">
                  <p className="font-medium">Exception Reports</p>
                  <p className="text-xs text-muted-foreground">Flagged documents</p>
                </div>
              </Button>
            </Link>

            <Link href="/staff/notes">
              <Button variant="outline" className="h-auto w-full justify-start gap-2 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <div className="text-left">
                  <p className="font-medium">Case Notes</p>
                  <p className="text-xs text-muted-foreground">View and add notes</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}