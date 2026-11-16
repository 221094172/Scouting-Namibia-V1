"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      console.log("[v0] Attempting login for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      const user = data.user
      if (!user) {
        setError("Login failed. Please try again.")
        return
      }

      console.log("[v0] Login successful, redirecting to feed")
      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      if (error.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.")
      } else if (error.message?.includes("Email not confirmed")) {
        setError(
          "Please verify your email address before logging in. Check your inbox for the verification link, or click 'Resend confirmation' below.",
        )
      } else {
        setError(error.message || "An error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email first")
      return
    }

    setIsLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        throw error
      }

      setResendSuccess(true)
    } catch (error: any) {
      console.error("[v0] Resend confirmation error:", error)
      setError(error.message || "Failed to resend confirmation email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    setIsLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setResendSuccess(true)
    } catch (error: any) {
      console.error("[v0] Password reset error:", error)
      setError(error.message || "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Login to your Scouting Namibia account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Email sent! Please check your inbox and spam folder for the verification or password reset link.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={handleResendConfirmation}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Resend confirmation
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
