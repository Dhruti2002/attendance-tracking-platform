"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, GraduationCap, Building, BarChart3, LogOut, Plus, Edit, Trash2, UserPlus, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  school_id: string | null
}

interface School {
  id: string
  name: string
  address: string
  district: string
  state: string
  principal_name: string
  contact_phone: string
  contact_email: string
}

interface Teacher {
  id: string
  full_name: string
  email: string
  role: string
  assigned_classes?: number
}

interface Class {
  id: string
  name: string
  grade: string
  section: string
  academic_year: string
  teacher_id: string | null
  teacher_name?: string
  student_count?: number
}

interface Student {
  id: string
  student_id: string
  full_name: string
  grade: string
  class_name: string
  is_active: boolean
}

export function AdminDashboard({ user }: { user: User }) {
  const [school, setSchool] = useState<School | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalStudents: 0,
    activeStudents: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddClass, setShowAddClass] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch school info
      const { data: schoolData } = await supabase.from("schools").select("*").eq("id", user.school_id).single()

      if (schoolData) setSchool(schoolData)

      // Fetch teachers
      const { data: teachersData } = await supabase
        .from("users")
        .select(`
          *,
          classes(count)
        `)
        .eq("school_id", user.school_id)
        .eq("role", "teacher")

      if (teachersData) {
        const teachersWithClasses = teachersData.map((teacher) => ({
          ...teacher,
          assigned_classes: teacher.classes?.[0]?.count || 0,
        }))
        setTeachers(teachersWithClasses)
      }

      // Fetch classes
      const { data: classesData } = await supabase
        .from("classes")
        .select(`
          *,
          users(full_name),
          students(count)
        `)
        .eq("school_id", user.school_id)

      if (classesData) {
        const classesWithDetails = classesData.map((cls) => ({
          ...cls,
          teacher_name: cls.users?.full_name || "Unassigned",
          student_count: cls.students?.[0]?.count || 0,
        }))
        setClasses(classesWithDetails)
      }

      // Fetch students
      const { data: studentsData } = await supabase
        .from("students")
        .select(`
          *,
          classes(name, grade)
        `)
        .eq("school_id", user.school_id)
        .order("full_name")

      if (studentsData) {
        const studentsWithClass = studentsData.map((student) => ({
          ...student,
          grade: student.classes?.grade || "N/A",
          class_name: student.classes?.name || "Unassigned",
        }))
        setStudents(studentsWithClass)
      }

      // Calculate stats
      setStats({
        totalTeachers: teachersData?.length || 0,
        totalClasses: classesData?.length || 0,
        totalStudents: studentsData?.length || 0,
        activeStudents: studentsData?.filter((s) => s.is_active).length || 0,
      })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{school?.name || "School Administration"}</p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="school">School Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">Active teaching staff</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">Across all grades</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeStudents} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">This month average</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Classes</CardTitle>
                  <CardDescription>Latest class activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classes.slice(0, 5).map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-gray-600">
                            Grade {cls.grade} • {cls.student_count} students
                          </p>
                        </div>
                        <Badge variant="outline">{cls.teacher_name}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teacher Overview</CardTitle>
                  <CardDescription>Teaching staff summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachers.slice(0, 5).map((teacher) => (
                      <div key={teacher.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{teacher.full_name}</p>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                        </div>
                        <Badge variant="secondary">{teacher.assigned_classes} classes</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
                <p className="text-gray-600">Manage teaching staff</p>
              </div>
              <Dialog open={showAddTeacher} onOpenChange={setShowAddTeacher}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Teacher</DialogTitle>
                    <DialogDescription>Invite a new teacher to join your school</DialogDescription>
                  </DialogHeader>
                  <AddTeacherForm
                    onSuccess={() => {
                      setShowAddTeacher(false)
                      fetchDashboardData()
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Classes Assigned</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{teacher.full_name}</td>
                          <td className="p-4 text-gray-600">{teacher.email}</td>
                          <td className="p-4">
                            <Badge variant="secondary">{teacher.assigned_classes} classes</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                                <Edit className="w-3 h-3" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
                <p className="text-gray-600">Manage school classes</p>
              </div>
              <Dialog open={showAddClass} onOpenChange={setShowAddClass}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Class</DialogTitle>
                    <DialogDescription>Create a new class for the current academic year</DialogDescription>
                  </DialogHeader>
                  <AddClassForm
                    teachers={teachers}
                    schoolId={user.school_id!}
                    onSuccess={() => {
                      setShowAddClass(false)
                      fetchDashboardData()
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <Card key={cls.id}>
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Teacher:</span>
                        <span className="font-medium">{cls.teacher_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">{cls.student_count}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1 bg-transparent">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                <p className="text-gray-600">Manage student enrollment</p>
              </div>
              <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Enroll a new student in your school</DialogDescription>
                  </DialogHeader>
                  <AddStudentForm
                    classes={classes}
                    schoolId={user.school_id!}
                    onSuccess={() => {
                      setShowAddStudent(false)
                      fetchDashboardData()
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Student ID</th>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Class</th>
                        <th className="text-left p-4 font-medium">Grade</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 20).map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{student.student_id}</td>
                          <td className="p-4 font-medium">{student.full_name}</td>
                          <td className="p-4">{student.class_name}</td>
                          <td className="p-4">{student.grade}</td>
                          <td className="p-4">
                            <Badge variant={student.is_active ? "default" : "secondary"}>
                              {student.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                                <Edit className="w-3 h-3" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="school" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
              <p className="text-gray-600">Manage your school details</p>
            </div>

            {school && (
              <Card>
                <CardHeader>
                  <CardTitle>School Details</CardTitle>
                  <CardDescription>Update your school information</CardDescription>
                </CardHeader>
                <CardContent>
                  <SchoolInfoForm school={school} onUpdate={fetchDashboardData} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Add Teacher Form Component
function AddTeacherForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // In a real app, you would send an invitation email
    // For now, we'll just show success
    setTimeout(() => {
      setIsLoading(false)
      onSuccess()
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Sending Invitation..." : "Send Invitation"}
      </Button>
    </form>
  )
}

// Add Class Form Component
function AddClassForm({
  teachers,
  schoolId,
  onSuccess,
}: {
  teachers: Teacher[]
  schoolId: string
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [section, setSection] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("classes").insert({
        name,
        grade,
        section,
        teacher_id: teacherId || null,
        school_id: schoolId,
        academic_year: "2024-25",
      })

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error("Error adding class:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Class Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Class 1A" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select value={grade} onValueChange={setGrade} required>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Grade {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="A, B, C..."
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
        <Select value={teacherId} onValueChange={setTeacherId}>
          <SelectTrigger>
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating Class..." : "Create Class"}
      </Button>
    </form>
  )
}

// Add Student Form Component
function AddStudentForm({
  classes,
  schoolId,
  onSuccess,
}: {
  classes: Class[]
  schoolId: string
  onSuccess: () => void
}) {
  const [studentId, setStudentId] = useState("")
  const [fullName, setFullName] = useState("")
  const [classId, setClassId] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("students").insert({
        student_id: studentId,
        full_name: fullName,
        class_id: classId,
        school_id: schoolId,
        date_of_birth: dateOfBirth,
        gender,
        parent_name: parentName,
        parent_phone: parentPhone,
        is_active: true,
      })

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error("Error adding student:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="STU001"
            required
          />
        </div>
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="class">Class</Label>
        <Select value={classId} onValueChange={setClassId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} (Grade {cls.grade})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={setGender} required>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="parentName">Parent/Guardian Name</Label>
          <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="parentPhone">Parent Phone</Label>
          <Input id="parentPhone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Adding Student..." : "Add Student"}
      </Button>
    </form>
  )
}

// School Info Form Component
function SchoolInfoForm({ school, onUpdate }: { school: School; onUpdate: () => void }) {
  const [formData, setFormData] = useState(school)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("schools").update(formData).eq("id", school.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error("Error updating school:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">School Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="principalName">Principal Name</Label>
        <Input
          id="principalName"
          value={formData.principal_name || ""}
          onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={formData.contact_phone || ""}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contact_email || ""}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Updating..." : "Update School Information"}
      </Button>
    </form>
  )
}
