"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, CheckCircle, LogOut, Plus, Eye } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  school_id: string | null
}

interface Class {
  id: string
  name: string
  grade: string
  section: string
  academic_year: string
  student_count?: number
}

interface AttendanceSession {
  id: string
  class_id: string
  date: string
  total_students: number
  present_count: number
  absent_count: number
  class_name: string
}

export function TeacherDashboard({ user }: { user: User }) {
  const [classes, setClasses] = useState<Class[]>([])
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch teacher's classes
      const { data: classesData } = await supabase
        .from("classes")
        .select(`
          *,
          students(count)
        `)
        .eq("teacher_id", user.id)

      if (classesData) {
        const classesWithCount = classesData.map((cls) => ({
          ...cls,
          student_count: cls.students?.[0]?.count || 0,
        }))
        setClasses(classesWithCount)
      }

      // Fetch recent attendance sessions
      const { data: sessionsData } = await supabase
        .from("attendance_sessions")
        .select(`
          *,
          classes(name)
        `)
        .eq("started_by", user.id)
        .order("started_at", { ascending: false })
        .limit(5)

      if (sessionsData) {
        const sessionsWithClassName = sessionsData.map((session) => ({
          ...session,
          class_name: session.classes?.name || "Unknown Class",
        }))
        setRecentSessions(sessionsWithClassName)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getAttendanceRate = (present: number, total: number) => {
    if (total === 0) return 0
    return Math.round((present / total) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.full_name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="attendance">Take Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classes.length}</div>
                  <p className="text-xs text-muted-foreground">Active classes this year</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentSessions.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Attendance taken today</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Sessions</CardTitle>
                <CardDescription>Your latest attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendance sessions yet</p>
                    <p className="text-sm text-gray-500">Start taking attendance to see your records here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{session.class_name}</h4>
                            <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {session.present_count}/{session.total_students} Present
                            </p>
                            <p className="text-xs text-gray-600">
                              {getAttendanceRate(session.present_count, session.total_students)}% attendance
                            </p>
                          </div>
                          <Badge
                            variant={
                              getAttendanceRate(session.present_count, session.total_students) >= 80
                                ? "default"
                                : "secondary"
                            }
                          >
                            {getAttendanceRate(session.present_count, session.total_students) >= 80 ? "Good" : "Low"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
                <p className="text-gray-600">Manage your assigned classes</p>
              </div>
            </div>

            {classes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
                  <p className="text-gray-600 mb-4">Contact your school administrator to get assigned to classes.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <Badge variant="outline">Grade {cls.grade}</Badge>
                      </div>
                      <CardDescription>
                        Section {cls.section} • {cls.academic_year}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{cls.student_count} students</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/attendance/${cls.id}`} className="flex-1">
                          <Button className="w-full gap-2" size="sm">
                            <Plus className="w-4 h-4" />
                            Take Attendance
                          </Button>
                        </Link>
                        <Link href={`/dashboard/class/${cls.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Take Attendance</h2>
              <p className="text-gray-600">Select a class to mark attendance</p>
            </div>

            {classes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
                  <p className="text-gray-600">You need to be assigned to classes before you can take attendance.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls) => (
                  <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {cls.name}
                        <Badge variant="outline">Grade {cls.grade}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Section {cls.section} • {cls.student_count} students
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/dashboard/attendance/${cls.id}`}>
                        <Button className="w-full gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Mark Attendance for {cls.name}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
