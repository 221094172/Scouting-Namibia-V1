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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const initAuth = async () => {
      const app = getFirebaseApp()
      const { getAuth, onAuthStateChanged } = await import("firebase/auth")
      const auth = getAuth(app)
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
          router.push("/auth/login")
        } else {
          setUser(currentUser)
        }
      })
    }
    
    initAuth()
    return () => { if (unsubscribe) unsubscribe() }
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
    setError(null)

    try {
      const app = getFirebaseApp()
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
      const { getFirestore, collection, addDoc, serverTimestamp } = await import("firebase/firestore")
      const storage = getStorage(app)
      const db = getFirestore(app)
      
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `videos/${user.uid}/${Date.now()}.${fileExt}`
      const storageRef = ref(storage, fileName)

      await uploadBytes(storageRef, selectedFile)
      const videoUrl = await getDownloadURL(storageRef)

      await addDoc(collection(db, "videos"), {
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
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      setError(error.message || "Failed to upload video")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
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
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                        Change Video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">MP4, MOV (max 100MB)</p>
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

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={!selectedFile || isLoading}>
                {isLoading ? "Uploading..." : "Post Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
