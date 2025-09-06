"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Users, ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Class {
  id: string
  name: string
  grade: string
  section: string
  academic_year: string
}

interface Student {
  id: string
  student_id: string
  full_name: string
  class_id: string
}

interface AttendanceRecord {
  student_id: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
}

export function AttendanceMarking({
  classData,
  students,
  userId,
}: {
  classData: Class
  students: Student[]
  userId: string
}) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const updateAttendance = (studentId: string, status: AttendanceRecord["status"], notes?: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        status,
        notes: notes || prev[studentId]?.notes || "",
      },
    }))
  }

  const updateNotes = (studentId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        status: prev[studentId]?.status || "present",
        notes,
      },
    }))
  }

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceRecord> = {}
    students.forEach((student) => {
      allPresent[student.id] = {
        student_id: student.id,
        status: "present",
        notes: "",
      }
    })
    setAttendance(allPresent)
  }

  const saveAttendance = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const today = new Date().toISOString().split("T")[0]

      // Create attendance session
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .insert({
          class_id: classData.id,
          date: today,
          started_by: userId,
          total_students: students.length,
          present_count: Object.values(attendance).filter((a) => a.status === "present").length,
          absent_count: Object.values(attendance).filter((a) => a.status === "absent").length,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create attendance records
      const records = Object.values(attendance).map((record) => ({
        student_id: record.student_id,
        class_id: classData.id,
        date: today,
        status: record.status,
        marked_by: userId,
        notes: record.notes || null,
        method: "manual",
      }))

      const { error: recordsError } = await supabase.from("attendance_records").upsert(records, {
        onConflict: "student_id,date",
        ignoreDuplicates: false,
      })

      if (recordsError) throw recordsError

      setSaveMessage("Attendance saved successfully!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error saving attendance:", error)
      setSaveMessage("Error saving attendance. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-100"
      case "absent":
        return "text-red-600 bg-red-100"
      case "late":
        return "text-yellow-600 bg-yellow-100"
      case "excused":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" />
      case "absent":
        return <XCircle className="w-4 h-4" />
      case "late":
        return <Clock className="w-4 h-4" />
      case "excused":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const presentCount = Object.values(attendance).filter((a) => a.status === "present").length
  const absentCount = Object.values(attendance).filter((a) => a.status === "absent").length
  const lateCount = Object.values(attendance).filter((a) => a.status === "late").length
  const excusedCount = Object.values(attendance).filter((a) => a.status === "excused").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
                <p className="text-sm text-gray-600">
                  {classData.name} • Grade {classData.grade} • Section {classData.section}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={markAllPresent} className="gap-2 bg-transparent">
                <CheckCircle className="w-4 h-4" />
                Mark All Present
              </Button>
              <Button
                onClick={saveAttendance}
                disabled={isSaving || Object.keys(attendance).length === 0}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
              <div className="text-sm text-gray-600">Late</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{excusedCount}</div>
              <div className="text-sm text-gray-600">Excused</div>
            </CardContent>
          </Card>
        </div>

        {saveMessage && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              saveMessage.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Attendance - {new Date().toLocaleDateString()}
            </CardTitle>
            <CardDescription>Mark attendance for each student in {classData.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => {
                const studentAttendance = attendance[student.id]
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {student.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{student.full_name}</h4>
                        <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Buttons */}
                      <div className="flex gap-1">
                        {(["present", "absent", "late", "excused"] as const).map((status) => (
                          <Button
                            key={status}
                            variant={studentAttendance?.status === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(student.id, status)}
                            className={`gap-1 ${studentAttendance?.status === status ? getStatusColor(status) : ""}`}
                          >
                            {getStatusIcon(status)}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>

                      {/* Notes */}
                      {studentAttendance && (
                        <div className="w-48">
                          <Textarea
                            placeholder="Add notes..."
                            value={studentAttendance.notes || ""}
                            onChange={(e) => updateNotes(student.id, e.target.value)}
                            className="h-8 text-sm resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
