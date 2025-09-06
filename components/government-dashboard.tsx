"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Building,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Download,
  LogOut,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface SchoolStats {
  id: string
  name: string
  district: string
  state: string
  total_students: number
  total_teachers: number
  total_classes: number
  avg_attendance_rate: number
  last_updated: string
}

interface DistrictSummary {
  district: string
  school_count: number
  total_students: number
  avg_attendance_rate: number
  compliance_status: "good" | "warning" | "critical"
}

interface AttendanceTrend {
  date: string
  attendance_rate: number
  total_present: number
  total_students: number
}

export function GovernmentDashboard({ user }: { user: User }) {
  const [schools, setSchools] = useState<SchoolStats[]>([])
  const [districts, setDistricts] = useState<DistrictSummary[]>([])
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("30")
  const [overallStats, setOverallStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    avgAttendanceRate: 0,
    complianceRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDistrict, selectedTimeRange])

  const fetchDashboardData = async () => {
    try {
      // Fetch schools with statistics
      let schoolQuery = supabase.from("schools").select(`
          *,
          users(count),
          classes(count),
          students(count)
        `)

      if (selectedDistrict !== "all") {
        schoolQuery = schoolQuery.eq("district", selectedDistrict)
      }

      const { data: schoolsData } = await schoolQuery

      if (schoolsData) {
        // Calculate attendance rates for each school (mock data for demo)
        const schoolsWithStats: SchoolStats[] = schoolsData.map((school) => ({
          id: school.id,
          name: school.name,
          district: school.district,
          state: school.state,
          total_students: school.students?.[0]?.count || 0,
          total_teachers: school.users?.[0]?.count || 0,
          total_classes: school.classes?.[0]?.count || 0,
          avg_attendance_rate: Math.floor(Math.random() * 20) + 75, // Mock: 75-95%
          last_updated: new Date().toISOString(),
        }))
        setSchools(schoolsWithStats)

        // Calculate district summaries
        const districtMap = new Map<string, DistrictSummary>()
        schoolsWithStats.forEach((school) => {
          const existing = districtMap.get(school.district) || {
            district: school.district,
            school_count: 0,
            total_students: 0,
            avg_attendance_rate: 0,
            compliance_status: "good" as const,
          }

          existing.school_count += 1
          existing.total_students += school.total_students
          existing.avg_attendance_rate = Math.floor(
            (existing.avg_attendance_rate * (existing.school_count - 1) + school.avg_attendance_rate) /
              existing.school_count,
          )
          existing.compliance_status =
            existing.avg_attendance_rate >= 80 ? "good" : existing.avg_attendance_rate >= 70 ? "warning" : "critical"

          districtMap.set(school.district, existing)
        })
        setDistricts(Array.from(districtMap.values()))

        // Calculate overall stats
        const totalSchools = schoolsWithStats.length
        const totalStudents = schoolsWithStats.reduce((sum, school) => sum + school.total_students, 0)
        const totalTeachers = schoolsWithStats.reduce((sum, school) => sum + school.total_teachers, 0)
        const avgAttendanceRate = Math.floor(
          schoolsWithStats.reduce((sum, school) => sum + school.avg_attendance_rate, 0) / totalSchools,
        )
        const complianceRate = Math.floor(
          (schoolsWithStats.filter((school) => school.avg_attendance_rate >= 75).length / totalSchools) * 100,
        )

        setOverallStats({
          totalSchools,
          totalStudents,
          totalTeachers,
          avgAttendanceRate: avgAttendanceRate || 0,
          complianceRate: complianceRate || 0,
        })

        // Generate mock attendance trends
        const trends: AttendanceTrend[] = []
        const days = Number.parseInt(selectedTimeRange)
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const rate = Math.floor(Math.random() * 15) + 80 // 80-95%
          trends.push({
            date: date.toISOString().split("T")[0],
            attendance_rate: rate,
            total_present: Math.floor((totalStudents * rate) / 100),
            total_students: totalStudents,
          })
        }
        setAttendanceTrends(trends)
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

  const exportReport = (type: string) => {
    // Mock export functionality
    const data = type === "schools" ? schools : districts
    const csv = convertToCSV(data)
    downloadCSV(csv, `${type}_report_${new Date().toISOString().split("T")[0]}.csv`)
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    return [headers, ...rows].join("\n")
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "critical":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading government dashboard...</p>
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
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Government Dashboard</h1>
                <p className="text-sm text-gray-600">Education Monitoring & Compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="district">District:</Label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {Array.from(new Set(schools.map((s) => s.district))).map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="gap-2 bg-transparent">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.totalSchools}</div>
                  <p className="text-xs text-muted-foreground">Across all districts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.totalStudents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">Teaching staff</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.avgAttendanceRate}%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {overallStats.avgAttendanceRate >= 85 ? (
                      <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    )}
                    Regional average
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.complianceRate}%</div>
                  <p className="text-xs text-muted-foreground">Schools meeting targets</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trends */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance Trends</CardTitle>
                    <CardDescription>Regional attendance patterns over time</CardDescription>
                  </div>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {attendanceTrends.map((trend, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(trend.attendance_rate / 100) * 200}px` }}
                      />
                      <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                        {new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* District Performance */}
            <Card>
              <CardHeader>
                <CardTitle>District Performance Summary</CardTitle>
                <CardDescription>Compliance status by district</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {districts.map((district) => (
                    <div key={district.district} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{district.district}</h4>
                          <p className="text-sm text-gray-600">
                            {district.school_count} schools • {district.total_students.toLocaleString()} students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{district.avg_attendance_rate}%</p>
                          <p className="text-xs text-gray-600">Avg attendance</p>
                        </div>
                        <Badge className={getComplianceColor(district.compliance_status)}>
                          {getComplianceIcon(district.compliance_status)}
                          {district.compliance_status.charAt(0).toUpperCase() + district.compliance_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">School Performance</h2>
                <p className="text-gray-600">Individual school attendance monitoring</p>
              </div>
              <Button onClick={() => exportReport("schools")} className="gap-2">
                <Download className="w-4 h-4" />
                Export Schools Report
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">School Name</th>
                        <th className="text-left p-4 font-medium">District</th>
                        <th className="text-left p-4 font-medium">Students</th>
                        <th className="text-left p-4 font-medium">Teachers</th>
                        <th className="text-left p-4 font-medium">Attendance Rate</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map((school) => (
                        <tr key={school.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{school.name}</td>
                          <td className="p-4">{school.district}</td>
                          <td className="p-4">{school.total_students}</td>
                          <td className="p-4">{school.total_teachers}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{school.avg_attendance_rate}%</span>
                              {school.avg_attendance_rate >= 85 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : school.avg_attendance_rate >= 75 ? (
                                <TrendingDown className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                school.avg_attendance_rate >= 80
                                  ? "default"
                                  : school.avg_attendance_rate >= 70
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {school.avg_attendance_rate >= 80
                                ? "Good"
                                : school.avg_attendance_rate >= 70
                                  ? "Warning"
                                  : "Critical"}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(school.last_updated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="districts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">District Analysis</h2>
                <p className="text-gray-600">District-level performance metrics</p>
              </div>
              <Button onClick={() => exportReport("districts")} className="gap-2">
                <Download className="w-4 h-4" />
                Export Districts Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {districts.map((district) => (
                <Card key={district.district}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{district.district}</CardTitle>
                      <Badge className={getComplianceColor(district.compliance_status)}>
                        {getComplianceIcon(district.compliance_status)}
                        {district.compliance_status.charAt(0).toUpperCase() + district.compliance_status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Schools:</span>
                        <span className="font-medium">{district.school_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Students:</span>
                        <span className="font-medium">{district.total_students.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Attendance:</span>
                        <span className="font-medium">{district.avg_attendance_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                        <div
                          className={`h-2 rounded-full ${
                            district.avg_attendance_rate >= 80
                              ? "bg-green-500"
                              : district.avg_attendance_rate >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${district.avg_attendance_rate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
              <p className="text-gray-600">Generate comprehensive reports for policy making</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Compliance Report
                  </CardTitle>
                  <CardDescription>Generate detailed compliance reports for regulatory requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reportPeriod">Report Period</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Generate Compliance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>Detailed analytics on attendance trends and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="analyticsType">Analytics Type</Label>
                      <Select defaultValue="trends">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trends">Attendance Trends</SelectItem>
                          <SelectItem value="comparison">District Comparison</SelectItem>
                          <SelectItem value="demographics">Demographic Analysis</SelectItem>
                          <SelectItem value="predictive">Predictive Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Generate Analytics Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Custom Report
                  </CardTitle>
                  <CardDescription>Create custom reports with specific parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dateRange">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" placeholder="Start date" />
                        <Input type="date" placeholder="End date" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="includeFields">Include Fields</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Fields</SelectItem>
                          <SelectItem value="attendance">Attendance Only</SelectItem>
                          <SelectItem value="demographics">Demographics</SelectItem>
                          <SelectItem value="performance">Performance Metrics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Generate Custom Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alert Summary
                  </CardTitle>
                  <CardDescription>Schools requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">Critical Attendance</p>
                        <p className="text-sm text-red-600">3 schools below 70%</p>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">Low Attendance</p>
                        <p className="text-sm text-yellow-600">7 schools below 80%</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                    <Button variant="outline" className="w-full gap-2 bg-transparent">
                      <FileText className="w-4 h-4" />
                      View Detailed Alert Report
                    </Button>
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
