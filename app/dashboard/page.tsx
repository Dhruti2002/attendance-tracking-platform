import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherDashboard } from "@/components/teacher-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  console.log("[v0] User profile:", profile)
  console.log("[v0] User role:", profile?.role)

  if (!profile) {
    redirect("/auth/login")
  }

  // Redirect based on role
  if (profile.role === "admin") {
    console.log("[v0] Redirecting to admin dashboard")
    redirect("/dashboard/admin")
  } else if (profile.role === "government") {
    console.log("[v0] Redirecting to government dashboard")
    redirect("/dashboard/government")
  }

  console.log("[v0] Showing teacher dashboard for role:", profile.role)
  return <TeacherDashboard user={profile} />
}
