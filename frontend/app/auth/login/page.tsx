import { redirect } from "next/navigation"
import LoginForm from "@/components/features/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  const role = searchParams.role || "student"
  
  return (
    <div className="min-h-screen bg-campus-darker flex items-center justify-center">
      <div className="max-w-md w-full">
        <LoginForm defaultRole={role} />
      </div>
    </div>
  )
}
