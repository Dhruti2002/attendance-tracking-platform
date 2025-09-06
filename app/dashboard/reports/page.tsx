import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsSystem } from "@/components/reports-system"

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  if (!profile) {
    redirect("/dashboard")
  }

  return <ReportsSystem user={profile} />
}
