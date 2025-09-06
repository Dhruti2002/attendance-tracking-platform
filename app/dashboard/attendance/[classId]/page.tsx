import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttendanceMarking } from "@/components/attendance-marking"

interface PageProps {
  params: Promise<{ classId: string }>
}

export default async function AttendancePage({ params }: PageProps) {
  const { classId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get class details
  const { data: classData } = await supabase.from("classes").select("*").eq("id", classId).single()

  if (!classData) {
    redirect("/dashboard")
  }

  // Get students in this class
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("full_name")

  return <AttendanceMarking classData={classData} students={students || []} userId={data.user.id} />
}
