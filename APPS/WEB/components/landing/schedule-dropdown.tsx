"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const APPOINTMENT_KEY = "dmv_appointment"
const BOOKINGS_KEY = "dmv_all_bookings"

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
}

export function ScheduleDropdown() {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkAppointment = () => {
      try {
        const appointmentRaw = localStorage.getItem(APPOINTMENT_KEY)
        if (appointmentRaw) {
          const apt = JSON.parse(appointmentRaw)
          if (apt.status === "scheduled") {
            setAppointment(apt)
          } else {
            setAppointment(null)
          }
        } else {
          setAppointment(null)
        }
      } catch {
        setAppointment(null)
      }
    }

    checkAppointment()
    const interval = setInterval(checkAppointment, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = () => {
    if (!appointment) return

    // Update status to cancelled
    const updated = { ...appointment, status: "cancelled" as const }
    localStorage.setItem(APPOINTMENT_KEY, JSON.stringify(updated))

    // Update global bookings
    try {
      const bookingsRaw = localStorage.getItem(BOOKINGS_KEY)
      const bookings: Appointment[] = bookingsRaw ? JSON.parse(bookingsRaw) : []
      const index = bookings.findIndex((b) => b.id === appointment.id)
      if (index !== -1) {
        bookings[index] = updated
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
      }
    } catch {
      // ignore
    }

    setAppointment(null)
    setIsOpen(false)
  }

  if (!appointment) {
    return null
  }

  const appointmentDate = new Date(appointment.date)
  const isUpcoming = appointmentDate >= new Date()

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-1.5 text-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          My Schedule
          {isUpcoming && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Upcoming Appointment</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              appointment.status === "scheduled" 
                ? "bg-green-100 text-green-700" 
                : "bg-muted text-muted-foreground"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
              {appointment.status === "scheduled" ? "Confirmed" : appointment.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Confirmation: {appointment.id}</p>
        </div>

        {/* Appointment Details */}
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-medium text-foreground">
                  {appointmentDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" at "}
                  {appointment.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">{appointment.locationName}</p>
                <p className="text-xs text-muted-foreground">{appointment.locationAddress}</p>
              </div>
            </div>
          </div>

          {/* What to bring reminder */}
          <div className="mt-4 rounded-md bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-medium text-blue-800">Remember to bring:</p>
            <ul className="mt-1 text-[10px] text-blue-700 list-disc list-inside">
              <li>Valid ID</li>
              <li>Proof of residency</li>
              <li>Payment for fees</li>
            </ul>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <div className="flex gap-2 p-3">
          <Link href="/appointment" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Reschedule
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
