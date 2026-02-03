import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive">
              <Trophy className="h-7 w-7 text-destructive-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {params?.error ? (
            <p className="text-sm text-muted-foreground text-center">Error: {params.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              An authentication error occurred. Please try again.
            </p>
          )}
          <Button asChild className="w-full">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
