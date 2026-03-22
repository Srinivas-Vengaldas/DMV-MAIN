"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

interface CaseNote {
  id: string
  verificationId: string
  documentType: string
  userName: string
  staffId: string
  staffName: string
  note: string
  createdAt: string
}

interface VerificationRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  documentType: string
  fileName: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  aiConfidence: number
  isStaffReview: boolean
}

export default function CaseNotesPage() {
  const { user } = useAuth()

  const [notes, setNotes] = useState<CaseNote[]>([])
  const [cases, setCases] = useState<VerificationRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<VerificationRequest | null>(null)
  const [newNote, setNewNote] = useState("")

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      const [notesRes, casesRes] = await Promise.all([
        fetch("/api/staff/case-notes", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/staff/verifications", {
          credentials: "include",
          cache: "no-store",
        }),
      ])

      const notesData = await notesRes.json()
      const casesData = await casesRes.json()

      if (!notesRes.ok) {
        throw new Error(notesData?.error || "Failed to load case notes")
      }

      if (!casesRes.ok) {
        throw new Error(casesData?.error || "Failed to load cases")
      }

      setNotes(notesData.notes || [])
      setCases(casesData.verifications || [])
    } catch (error) {
      console.error("Failed to load notes page data:", error)
      setNotes([])
      setCases([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) return

    try {
      setIsSaving(true)

      const res = await fetch("/api/staff/case-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          verificationId: selectedCase.id,
          note: newNote.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add note")
      }

      setIsAddModalOpen(false)
      setSelectedCase(null)
      setNewNote("")
      await loadData()
    } catch (error) {
      console.error("Failed to add case note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) =>
        n.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.note.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, searchQuery])

  const myNotes = filteredNotes.filter((n) => n.staffId === user?.id)
  const teamNotes = filteredNotes.filter((n) => n.staffId !== user?.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Case Notes</h1>
        <p className="text-sm text-muted-foreground">
          Add and view notes for resident cases to help future reviewers
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>

            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Notes</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading notes..."
              : `${myNotes.length} note${myNotes.length !== 1 ? "s" : ""} you have added`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading notes...</p>
            </div>
          ) : myNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <p className="mt-4 text-sm font-medium text-muted-foreground">No notes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add notes to cases to track decision history</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{note.userName}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {note.documentType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-muted/50 p-3">
                    <p className="text-sm text-foreground">{note.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {teamNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Team Notes</CardTitle>
            <CardDescription>
              Notes from all staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {teamNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{note.userName}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {note.documentType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          By {note.staffName} • {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-muted/50 p-3">
                    <p className="text-sm text-foreground">{note.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Case Note</DialogTitle>
            <DialogDescription>
              Add a note to a case to help future reviewers understand the decision history.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Select Case</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                {cases.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No cases available
                  </p>
                ) : (
                  cases.map((c) => (
                    <div
                      key={c.id}
                      className={`cursor-pointer border-b border-border p-3 transition-colors last:border-b-0 ${
                        selectedCase?.id === c.id ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCase(c)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-4 w-4 rounded-full border-2 ${
                            selectedCase?.id === c.id
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{c.userName}</p>
                          <p className="text-xs text-muted-foreground">{c.documentType}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note about this case..."
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!selectedCase || !newNote.trim() || isSaving}>
              {isSaving ? "Saving..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}