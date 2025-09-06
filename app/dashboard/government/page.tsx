import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GovernmentDashboard } from "@/components/government-dashboard"

export default async function GovernmentDashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  if (!profile || profile.role !== "government") {
    redirect("/dashboard")
  }

  return <GovernmentDashboard user={profile} />
}
