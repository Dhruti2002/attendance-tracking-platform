"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  GraduationCap,
  BarChart3,
  ArrowLeft,
  Filter,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { addDays } from "date-fns"
import type { DateRange } from "react-day-picker"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  school_id: string | null
}

interface AttendanceReport {
  date: string
  class_name: string
  total_students: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

interface StudentReport {
  student_id: string
  student_name: string
  class_name: string
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  attendance_rate: number
  trend: "improving" | "declining" | "stable"
}

interface ClassAnalytics {
  class_name: string
  grade: string
  total_students: number
  avg_attendance_rate: number
  best_day: string
  worst_day: string
  trend: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function ReportsSystem({ user }: { user: User }) {
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([])
  const [studentReports, setStudentReports] = useState<StudentReport[]>([])
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [reportType, setReportType] = useState<string>("attendance")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchReportsData()
  }, [selectedClass, selectedGrade, dateRange])

  const fetchReportsData = async () => {
    try {
      // Generate mock data for demonstration
      // In a real app, this would fetch from the database with proper filters

      // Mock attendance reports
      const mockAttendanceReports: AttendanceReport[] = []
      const classes = ["Class 1A", "Class 1B", "Class 2A", "Class 2B", "Class 3A"]

      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        classes.forEach((className) => {
          const totalStudents = Math.floor(Math.random() * 20) + 25
          const present = Math.floor(totalStudents * (0.75 + Math.random() * 0.2))
          const late = Math.floor(Math.random() * 3)
          const excused = Math.floor(Math.random() * 2)
          const absent = totalStudents - present - late - excused

          mockAttendanceReports.push({
            date: date.toISOString().split("T")[0],
            class_name: className,
            total_students: totalStudents,
            present,
            absent: Math.max(0, absent),
            late,
            excused,
            attendance_rate: Math.round((present / totalStudents) * 100),
          })
        })
      }
      setAttendanceReports(mockAttendanceReports)

      // Mock student reports
      const mockStudentReports: StudentReport[] = []
      const studentNames = [
        "Rahul Kumar",
        "Priya Sharma",
        "Amit Singh",
        "Sneha Patel",
        "Arjun Reddy",
        "Kavya Nair",
        "Rohan Gupta",
        "Ananya Das",
        "Vikram Joshi",
        "Meera Iyer",
      ]

      studentNames.forEach((name, index) => {
        const totalDays = 30
        const presentDays = Math.floor(totalDays * (0.7 + Math.random() * 0.25))
        const lateDays = Math.floor(Math.random() * 3)
        const absentDays = totalDays - presentDays - lateDays

        mockStudentReports.push({
          student_id: `STU${String(index + 1).padStart(3, "0")}`,
          student_name: name,
          class_name: classes[index % classes.length],
          total_days: totalDays,
          present_days: presentDays,
          absent_days: Math.max(0, absentDays),
          late_days: lateDays,
          attendance_rate: Math.round((presentDays / totalDays) * 100),
          trend: Math.random() > 0.5 ? "improving" : Math.random() > 0.5 ? "declining" : "stable",
        })
      })
      setStudentReports(mockStudentReports)

      // Mock class analytics
      const mockClassAnalytics: ClassAnalytics[] = classes.map((className) => ({
        class_name: className,
        grade: className.includes("1") ? "1" : className.includes("2") ? "2" : "3",
        total_students: Math.floor(Math.random() * 20) + 25,
        avg_attendance_rate: Math.floor(Math.random() * 20) + 75,
        best_day: "Monday",
        worst_day: "Friday",
        trend: Math.random() * 10 - 5, // -5 to +5
      }))
      setClassAnalytics(mockClassAnalytics)
    } catch (error) {
      console.error("Error fetching reports data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (format: "pdf" | "csv") => {
    setIsGenerating(true)

    // Mock report generation
    setTimeout(() => {
      const filename = `attendance_report_${new Date().toISOString().split("T")[0]}.${format}`

      if (format === "csv") {
        const csvData = convertToCSV(attendanceReports)
        downloadFile(csvData, filename, "text/csv")
      } else {
        // Mock PDF generation
        const pdfContent = "Mock PDF content would be generated here"
        downloadFile(pdfContent, filename, "application/pdf")
      }

      setIsGenerating(false)
    }, 2000)
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    return [headers, ...rows].join("\n")
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Prepare chart data
  const attendanceChartData = attendanceReports
    .filter((report) => selectedClass === "all" || report.class_name === selectedClass)
    .reduce(
      (acc, report) => {
        const existing = acc.find((item) => item.date === report.date)
        if (existing) {
          existing.attendance_rate = Math.round((existing.attendance_rate + report.attendance_rate) / 2)
        } else {
          acc.push({
            date: new Date(report.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            attendance_rate: report.attendance_rate,
          })
        }
        return acc
      },
      [] as { date: string; attendance_rate: number }[],
    )
    .slice(-14) // Last 14 days

  const classComparisonData = classAnalytics.map((cls) => ({
    name: cls.class_name,
    attendance_rate: cls.avg_attendance_rate,
    students: cls.total_students,
  }))

  const attendanceDistributionData = [
    { name: "Present", value: attendanceReports.reduce((sum, r) => sum + r.present, 0), color: "#00C49F" },
    { name: "Absent", value: attendanceReports.reduce((sum, r) => sum + r.absent, 0), color: "#FF8042" },
    { name: "Late", value: attendanceReports.reduce((sum, r) => sum + r.late, 0), color: "#FFBB28" },
    { name: "Excused", value: attendanceReports.reduce((sum, r) => sum + r.excused, 0), color: "#8884D8" },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

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
                <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-600">Comprehensive attendance insights and reporting</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchReportsData} className="gap-2 bg-transparent">
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
            <TabsTrigger value="students">Student Reports</TabsTrigger>
            <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="Class 1A">Class 1A</SelectItem>
                        <SelectItem value="Class 1B">Class 1B</SelectItem>
                        <SelectItem value="Class 2A">Class 2A</SelectItem>
                        <SelectItem value="Class 2B">Class 2B</SelectItem>
                        <SelectItem value="Class 3A">Class 3A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="1">Grade 1</SelectItem>
                        <SelectItem value="2">Grade 2</SelectItem>
                        <SelectItem value="3">Grade 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Date Range</Label>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      attendanceReports.reduce((sum, r) => sum + r.attendance_rate, 0) / attendanceReports.length || 0,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1 text-green-600" />
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {attendanceReports.reduce((sum, r) => sum + r.present, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Student-days present</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {attendanceReports.reduce((sum, r) => sum + r.absent, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Student-days absent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes Analyzed</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAnalytics.length}</div>
                  <p className="text-xs text-muted-foreground">Active classes</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Daily attendance rates over the last 2 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={attendanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[60, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="attendance_rate" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Class Comparison</CardTitle>
                  <CardDescription>Average attendance rates by class</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[60, 100]} />
                      <Tooltip />
                      <Bar dataKey="attendance_rate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                  <CardDescription>Breakdown of attendance status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attendanceDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Class Performance</CardTitle>
                  <CardDescription>Detailed class analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classAnalytics.slice(0, 4).map((cls) => (
                      <div key={cls.class_name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{cls.class_name}</p>
                          <p className="text-sm text-gray-600">{cls.total_students} students</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{cls.avg_attendance_rate}%</p>
                          <Badge variant={cls.avg_attendance_rate >= 85 ? "default" : "secondary"}>
                            {cls.trend > 0 ? "↗" : cls.trend < 0 ? "↘" : "→"}
                            {cls.trend > 0 ? "Improving" : cls.trend < 0 ? "Declining" : "Stable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
                <p className="text-gray-600">Detailed daily attendance records</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => generateReport("csv")} disabled={isGenerating} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => generateReport("pdf")}
                  disabled={isGenerating}
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Class</th>
                        <th className="text-left p-4 font-medium">Total Students</th>
                        <th className="text-left p-4 font-medium">Present</th>
                        <th className="text-left p-4 font-medium">Absent</th>
                        <th className="text-left p-4 font-medium">Late</th>
                        <th className="text-left p-4 font-medium">Excused</th>
                        <th className="text-left p-4 font-medium">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReports
                        .filter((report) => selectedClass === "all" || report.class_name === selectedClass)
                        .slice(0, 50)
                        .map((report, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-4">{new Date(report.date).toLocaleDateString()}</td>
                            <td className="p-4 font-medium">{report.class_name}</td>
                            <td className="p-4">{report.total_students}</td>
                            <td className="p-4 text-green-600 font-medium">{report.present}</td>
                            <td className="p-4 text-red-600 font-medium">{report.absent}</td>
                            <td className="p-4 text-yellow-600 font-medium">{report.late}</td>
                            <td className="p-4 text-blue-600 font-medium">{report.excused}</td>
                            <td className="p-4">
                              <Badge variant={report.attendance_rate >= 85 ? "default" : "secondary"}>
                                {report.attendance_rate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Reports</h2>
                <p className="text-gray-600">Individual student attendance analysis</p>
              </div>
              <Button onClick={() => generateReport("csv")} className="gap-2">
                <Download className="w-4 h-4" />
                Export Student Report
              </Button>
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
                        <th className="text-left p-4 font-medium">Present Days</th>
                        <th className="text-left p-4 font-medium">Absent Days</th>
                        <th className="text-left p-4 font-medium">Late Days</th>
                        <th className="text-left p-4 font-medium">Attendance Rate</th>
                        <th className="text-left p-4 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReports.map((student) => (
                        <tr key={student.student_id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{student.student_id}</td>
                          <td className="p-4 font-medium">{student.student_name}</td>
                          <td className="p-4">{student.class_name}</td>
                          <td className="p-4 text-green-600">{student.present_days}</td>
                          <td className="p-4 text-red-600">{student.absent_days}</td>
                          <td className="p-4 text-yellow-600">{student.late_days}</td>
                          <td className="p-4">
                            <Badge variant={student.attendance_rate >= 85 ? "default" : "secondary"}>
                              {student.attendance_rate}%
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                student.trend === "improving"
                                  ? "default"
                                  : student.trend === "declining"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {student.trend === "improving" ? "↗" : student.trend === "declining" ? "↘" : "→"}
                              {student.trend.charAt(0).toUpperCase() + student.trend.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
              <p className="text-gray-600">Generate customized reports with specific parameters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Customize your report parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Attendance Summary</SelectItem>
                        <SelectItem value="student_performance">Student Performance</SelectItem>
                        <SelectItem value="class_analysis">Class Analysis</SelectItem>
                        <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Include Data Points</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="daily_attendance" defaultChecked />
                        <Label htmlFor="daily_attendance">Daily Attendance Rates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="student_details" defaultChecked />
                        <Label htmlFor="student_details">Individual Student Details</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="class_summaries" defaultChecked />
                        <Label htmlFor="class_summaries">Class Summaries</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="trend_analysis" />
                        <Label htmlFor="trend_analysis">Trend Analysis</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="charts_graphs" />
                        <Label htmlFor="charts_graphs">Charts and Graphs</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => generateReport("pdf")} disabled={isGenerating} className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    {isGenerating ? "Generating Report..." : "Generate Custom Report"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>Preview of your custom report configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Report Summary</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Report Type: {reportType.replace("_", " ").toUpperCase()}</li>
                        <li>
                          • Date Range: {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
                        </li>
                        <li>• Classes: {selectedClass === "all" ? "All Classes" : selectedClass}</li>
                        <li>• Grades: {selectedGrade === "all" ? "All Grades" : `Grade ${selectedGrade}`}</li>
                        <li>• Estimated Records: {attendanceReports.length.toLocaleString()}</li>
                      </ul>
                    </div>

                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Report preview will appear here</p>
                      <p className="text-xs text-gray-500">Configure your settings and generate the report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
