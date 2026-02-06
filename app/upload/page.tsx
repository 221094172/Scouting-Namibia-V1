"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Video } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

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

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    position: "",
    region: "",
    town: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/auth/login")
      } else {
        setUser(session.user)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/auth/login")
      } else {
        setUser(session.user)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Please select a video file")
      return
    }

    if (!user) {
      setError("Not authenticated")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.uid}/${Date.now()}.${fileExt}`

      console.log("[v0] Starting upload for file:", selectedFile.name, "Size:", selectedFile.size, "bytes")

      // Upload to Supabase Storage
      let uploadStartTime = Date.now()
      let lastProgressUpdate = 0

      const { data, error: uploadError } = await supabase.storage
        .from("Video")
        .upload(fileName, selectedFile, {
          onUploadProgress: (progress) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 100)

            // Only update state once per second to avoid excessive re-renders
            const now = Date.now()
            if (now - lastProgressUpdate >= 1000 || progressPercent === 100) {
              setUploadProgress(progressPercent)
              lastProgressUpdate = now

              const elapsedSeconds = (now - uploadStartTime) / 1000
              const mbTransferred = (progress.loaded / (1024 * 1024)).toFixed(1)
              const mbTotal = (progress.total / (1024 * 1024)).toFixed(1)
              console.log(`[v0] Upload progress: ${progressPercent}% (${mbTransferred}MB / ${mbTotal}MB) - ${elapsedSeconds.toFixed(1)}s elapsed`)
            }
          },
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        let errorMessage = "Failed to upload video"

        if (uploadError.message.includes("unauthorized")) {
          errorMessage = "Not authorized to upload. Check Supabase Storage permissions."
        } else if (uploadError.message.includes("not found")) {
          errorMessage = "Storage bucket not found. Please check bucket configuration."
        }

        setError(errorMessage)
        setIsLoading(false)
        return
      }

      const uploadTime = (Date.now() - uploadStartTime) / 1000
      console.log(`[v0] Upload completed successfully in ${uploadTime.toFixed(1)}s`)

      try {
        console.log("[v0] Getting download URL...")
        const { data: urlData } = supabase.storage.from("Video").getPublicUrl(fileName)
        const videoUrl = urlData?.publicUrl
        console.log("[v0] Download URL obtained:", videoUrl.substring(0, 50) + "...")

        console.log("[v0] Saving video metadata to Supabase...")
        const { error: insertError } = await supabase.from("videos").insert({
          user_id: user.uid,
          title: formData.title,
          description: formData.description,
          video_url: videoUrl,
          position: formData.position || null,
          region: formData.region || null,
          town: formData.town || null,
          like_count: 0,
          comment_count: 0,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          throw insertError
        }

        // Increment video_count for user profile
        console.log("[v0] Updating user video count...")
        const { data: playerProfile } = await supabase
          .from("player_profiles")
          .select("video_count")
          .eq("id", user.uid)
          .single()

        if (playerProfile) {
          await supabase
            .from("player_profiles")
            .update({ video_count: (playerProfile.video_count || 0) + 1 })
            .eq("id", user.uid)
        }

        console.log("[v0] Video metadata saved successfully. Redirecting to feed...")
        setIsLoading(false)
        router.push("/feed")
        router.refresh()
      } catch (error: any) {
        console.error("[v0] Metadata error:", error)
        setError("Video uploaded but failed to save metadata. Please try again.")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      setError(error.message || "Failed to upload video")
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
        setError(`File size (${sizeMB}MB) exceeds 100MB limit. Please compress your video.`)
        return
      }

      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file")
        return
      }

      setError(null)
      setSelectedFile(file)
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/feed">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Create Post</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Video Upload */}
              <div className="space-y-2">
                <Label>Video</Label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-12 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <Video className="mx-auto h-12 w-12 text-primary" />
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setSelectedFile(null)
                        setUploadProgress(0)
                      }}>
                        Change Video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">MP4, MOV, WebM (max 100MB)</p>
                      <p className="text-xs text-muted-foreground mt-1">Tip: Compress videos larger than 50MB for faster uploads</p>
                      <Input type="file" accept="video/*" onChange={handleFileChange} className="mt-4" />
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your video a title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell your story..."
                  rows={4}
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Position (Optional)</Label>
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

              {/* Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region">Region (Optional)</Label>
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
                  <Label htmlFor="town">Town (Optional)</Label>
                  <Input
                    id="town"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    placeholder="e.g. Windhoek"
                  />
                </div>
              </div>

              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">{error}</p>
                  {error.includes("CORS") && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      This is a backend configuration issue. Contact the administrator to configure Firebase Storage CORS settings.
                    </p>
                  )}
                </div>
              )}

              {isLoading && (
                <div className="space-y-2">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{uploadProgress}% uploaded</p>
                  <p className="text-xs text-muted-foreground text-center">Check browser console (F12) for detailed upload progress</p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={!selectedFile || isLoading}>
                {isLoading ? `Uploading... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : "Post Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
