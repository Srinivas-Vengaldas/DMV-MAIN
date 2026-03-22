"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  staffId?: string
  staffName?: string
  completedAt?: string
  documentFileName?: string
}

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed" | "no-show">("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Appointment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const loadBookings = async () => {
    try {
      const res = await fetch("/api/staff/appointments", {
        credentials: "include",
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load bookings")
      }

      const allBookings: Appointment[] = Array.isArray(data?.appointments)
        ? data.appointments
        : []

      setBookings(
        allBookings.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      )
      setErrorMessage("")
    } catch (error) {
      console.error("Failed to load staff bookings:", error)
      setBookings([])
      setErrorMessage(error instanceof Error ? error.message : "Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
    const interval = setInterval(loadBookings, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        booking.userName.toLowerCase().includes(query) ||
        booking.userEmail.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        booking.locationName.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    switch (filter) {
      case "today":
        return bookingDate >= today && bookingDate < tomorrow && booking.status === "scheduled"
      case "upcoming":
        return bookingDate >= tomorrow && booking.status === "scheduled"
      case "completed":
        return booking.status === "completed"
      case "no-show":
        return booking.status === "no_show"
      default:
        return true
    }
  })

  const handleMarkComplete = async () => {
    if (!selectedBooking) return

    setIsProcessing(true)

    try {
      const res = await fetch(`/api/staff/appointments/${selectedBooking.id}/complete`, {
        method: "POST",
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to mark appointment complete")
      }

      await loadBookings()
      setErrorMessage("")
      setIsDetailModalOpen(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error("Mark complete failed:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to mark appointment complete"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkNoShow = async () => {
    if (!selectedBooking) return

    setIsProcessing(true)

    try {
      const res = await fetch(`/api/staff/appointments/${selectedBooking.id}/no-show`, {
        method: "POST",
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to mark appointment as no-show")
      }

      await loadBookings()
      setErrorMessage("")
      setIsDetailModalOpen(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error("Mark no-show failed:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to mark appointment as no-show"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Scheduled
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Completed
          </span>
        )
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
            Cancelled
          </span>
        )
      case "no_show":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            No-Show
          </span>
        )
      default:
        return null
    }
  }

  const todayCount = bookings.filter((b) => {
    const bookingDate = new Date(b.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return bookingDate >= today && bookingDate < tomorrow && b.status === "scheduled"
  }).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage resident appointments
          </p>
        </div>

        {todayCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-sm font-semibold text-blue-700">
              {todayCount} appointments today
            </span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["today", "upcoming", "completed", "no-show", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 w-4 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="mt-3 text-sm text-muted-foreground">No bookings found</p>
          <p className="text-xs text-muted-foreground/70">
            {filter === "today" ? "No appointments scheduled for today" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resident</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => {
                  const bookingDate = new Date(booking.date)

                  return (
                    <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {booking.userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{booking.userName}</p>
                            <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {bookingDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.time}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{booking.locationName}</p>
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(booking.status)}
                        {booking.staffName && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            by {booking.staffName}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>{selectedBooking?.id}</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {selectedBooking.userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedBooking.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.userEmail}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedBooking.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {selectedBooking.time}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium text-foreground">{selectedBooking.locationName}</p>
                </div>
              </div>

              {selectedBooking.documentFileName && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Submitted Document</p>
                      <p className="text-xs text-muted-foreground">{selectedBooking.documentFileName}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.status === "completed" && selectedBooking.staffName && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-green-700">
                    Completed by <span className="font-medium">{selectedBooking.staffName}</span> on{" "}
                    {new Date(selectedBooking.completedAt || "").toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedBooking?.status === "scheduled" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleMarkNoShow}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  No-Show
                </Button>
                <Button
                  onClick={handleMarkComplete}
                  disabled={isProcessing}
                  className="gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  Mark Complete
                </Button>
              </>
            )}
            {selectedBooking?.status !== "scheduled" && (
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}