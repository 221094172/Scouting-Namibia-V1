import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>Almost there! One more step to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We've sent a confirmation email to your inbox. Please click the link in the email to verify your account and
            complete your registration.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            After confirming your email, you can log in and start showcasing your talent!
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
