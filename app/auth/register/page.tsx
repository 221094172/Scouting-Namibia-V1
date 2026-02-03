"use client"

import type React from "react"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy } from "lucide-react"
import { getFirebaseApp } from "@/lib/firebase/config"

const NAMIBIA_REGIONS = [
  "Erongo",
  "Hardap",
  "Karas",
  "Kavango East",
  "Kavango West",
  "Khomas",
  "Kunene",
  "Ohangwena",
  "Omaheke",
  "Omusati",
  "Oshana",
  "Oshikoto",
  "Otjozondjupa",
  "Zambezi",
]

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Striker", "Winger"]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role") || "player"

  const [role, setRole] = useState<"player" | "coach" | "club">(roleParam as any)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    region: "",
    town: "",
    age: "",
    gender: "",
    position: "",
    sport: "Football",
    clubName: "",
    experience: "",
    contactInfo: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting registration for:", formData.email)
      
      // Initialize Firebase App first, then dynamically import services
      const app = getFirebaseApp()
      
      // Dynamic imports to ensure app is initialized first
      const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } = await import("firebase/auth")
      const { getFirestore, doc, setDoc, serverTimestamp } = await import("firebase/firestore")
      
      const auth = getAuth(app)
      const db = getFirestore(app)

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Update display name
      await updateProfile(user, {
        displayName: formData.name,
      })

      await setDoc(doc(db, "profiles", user.uid), {
        id: user.uid,
        email: formData.email,
        display_name: formData.name,
        role: role,
        region: formData.region,
        town: formData.town,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        video_count: 0,
        followers_count: 0,
        following_count: 0,
      })

      if (role === "player") {
        await setDoc(doc(db, "player_profiles", user.uid), {
          id: user.uid,
          age: Number.parseInt(formData.age) || null,
          gender: formData.gender || null,
          position: formData.position || null,
          height: null,
          weight: null,
          current_club: null,
          achievements: null,
          skills: null,
          endorsements_count: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      } else if (role === "coach") {
        await setDoc(doc(db, "coach_profiles", user.uid), {
          id: user.uid,
          club_name: formData.clubName || null,
          experience_level: formData.experience || null,
          specialization: null,
          certifications: null,
          bio: null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      } else if (role === "club") {
        await setDoc(doc(db, "club_profiles", user.uid), {
          id: user.uid,
          club_name: formData.name,
          league: null,
          founded_year: null,
          stadium: null,
          contact_info: formData.contactInfo || null,
          website: null,
          description: null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      }

      // Send verification email
      await sendEmailVerification(user)

      console.log("[v0] Registration successful, email verification sent")
      router.push("/auth/sign-up-success")
    } catch (error: any) {
      console.error("[v0] Registration error:", error)
      setError(error.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Join Scouting Namibia and start your journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I am a</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{role === "club" ? "Club Name" : "Full Name"}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {NAMIBIA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="town">Town</Label>
                <Input
                  id="town"
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  placeholder="e.g. Windhoek"
                  required
                />
              </div>
            </div>

            {/* Player Fields */}
            {role === "player" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Coach Fields */}
            {role === "coach" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club/Team</Label>
                  <Input
                    id="clubName"
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                    placeholder="e.g. Blue Waters FC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(v) => setFormData({ ...formData, experience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (6-10 years)</SelectItem>
                      <SelectItem value="professional">Professional (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Club Fields */}
            {role === "club" && (
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="Phone or website"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
