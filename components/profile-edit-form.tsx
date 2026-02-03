"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { doc, updateDoc } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase/client"

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

export default function ProfileEditForm({ profile, roleData }: { profile: any; roleData: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    region: profile.region || "",
    town: profile.town || "",
    phone_number: profile.phone_number || "",
    // Player fields
    age: roleData?.age || "",
    position: roleData?.position || "",
    preferred_foot: roleData?.preferred_foot || "",
    height_cm: roleData?.height_cm || "",
    weight_kg: roleData?.weight_kg || "",
    experience_years: roleData?.experience_years || "",
    current_club: roleData?.current_club || "",
    achievements: roleData?.achievements || "",
    // Coach fields
    coaching_license: roleData?.coaching_license || "",
    years_experience: roleData?.years_experience || "",
    specialization: roleData?.specialization || "",
    // Club fields
    club_name: roleData?.club_name || "",
    founded_year: roleData?.founded_year || "",
    league: roleData?.league || "",
    stadium: roleData?.stadium || "",
    contact_person: roleData?.contact_person || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const db = await getFirebaseDb()
      await updateDoc(doc(db, "profiles", profile.id), {
        display_name: formData.display_name,
        bio: formData.bio,
        region: formData.region,
        town: formData.town,
        phone_number: formData.phone_number,
      })

      if (profile.role === "player") {
        await updateDoc(doc(db, "player_profiles", profile.id), {
          age: formData.age ? Number.parseInt(formData.age) : null,
          position: formData.position || null,
          preferred_foot: formData.preferred_foot || null,
          height_cm: formData.height_cm ? Number.parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? Number.parseInt(formData.weight_kg) : null,
          experience_years: formData.experience_years ? Number.parseInt(formData.experience_years) : null,
          current_club: formData.current_club || null,
          achievements: formData.achievements || null,
        })
      } else if (profile.role === "coach") {
        await updateDoc(doc(db, "coach_profiles", profile.id), {
          coaching_license: formData.coaching_license || null,
          years_experience: formData.years_experience ? Number.parseInt(formData.years_experience) : null,
          specialization: formData.specialization || null,
          current_club: formData.current_club || null,
        })
      } else if (profile.role === "club") {
        await updateDoc(doc(db, "club_profiles", profile.id), {
          club_name: formData.club_name,
          founded_year: formData.founded_year ? Number.parseInt(formData.founded_year) : null,
          league: formData.league || null,
          stadium: formData.stadium || null,
          contact_person: formData.contact_person || null,
        })
      }

      router.push(`/profile/${profile.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error updating profile:", error)
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">{profile.role === "club" ? "Club Name" : "Display Name"}</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {profile.role === "player" && (
        <Card>
          <CardHeader>
            <CardTitle>Player Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
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
              <div className="space-y-2">
                <Label htmlFor="preferred_foot">Preferred Foot</Label>
                <Select
                  value={formData.preferred_foot}
                  onValueChange={(v) => setFormData({ ...formData, preferred_foot: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select foot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_club">Current Club</Label>
                <Input
                  id="current_club"
                  value={formData.current_club}
                  onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Achievements</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows={4}
                placeholder="List your achievements..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role === "coach" && (
        <Card>
          <CardHeader>
            <CardTitle>Coach Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coaching_license">Coaching License</Label>
                <Input
                  id="coaching_license"
                  value={formData.coaching_license}
                  onChange={(e) => setFormData({ ...formData, coaching_license: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Youth Development"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_club">Current Club</Label>
                <Input
                  id="current_club"
                  value={formData.current_club}
                  onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role === "club" && (
        <Card>
          <CardHeader>
            <CardTitle>Club Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="league">League</Label>
                <Input
                  id="league"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stadium">Stadium</Label>
                <Input
                  id="stadium"
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
