"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Home,
  Compass,
  PlusCircle,
  MessageCircle,
  User,
  Heart,
  MessageSquare,
  Share2,
  Filter,
  MapPin,
  Trophy,
  Search,
} from "lucide-react"
import { getFirebaseApp } from "@/lib/firebase/config"

const NAMIBIA_REGIONS = [
  "All Regions",
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

export default function FeedClient({
  videos,
  userProfile,
  userId,
}: {
  videos: any[]
  userProfile: any
  userId: string
}) {
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "messages" | "profile">("home")
  const [selectedRegion, setSelectedRegion] = useState("All Regions")
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredVideos = videos.filter((video) => {
    const matchesRegion = selectedRegion === "All Regions" || video.region === selectedRegion
    const matchesSearch =
      !searchQuery ||
      video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRegion && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Scouting Namibia</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="border-t border-border bg-muted/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players, coaches..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue />
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
          </div>
        )}
      </header>

      {/* Main Feed */}
      <main className="mx-auto max-w-2xl">
        {activeTab === "home" && (
          <div className="space-y-1">
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => <VideoPost key={video.id} video={video} userId={userId} />)
            ) : (
              <div className="p-6">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No videos found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or upload your first video
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "explore" && (
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Explore Talent</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/video/${video.id}`}>
                    <div className="aspect-video bg-muted relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Trophy className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={video.profiles?.profile_image_url || "/placeholder.svg"} />
                          <AvatarFallback>{video.profiles?.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{video.profiles?.display_name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{video.town}</p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{video.title}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Messages</h2>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start connecting with players, coaches, and clubs</p>
                <Button asChild className="mt-4">
                  <Link href="/chat">View Messages</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "profile" && userProfile && (
          <div className="p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={userProfile.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback>{userProfile.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-foreground mb-1">{userProfile.display_name}</h2>
                  <Badge variant="secondary" className="mb-2 capitalize">
                    {userProfile.role}
                  </Badge>
                  {userProfile.region && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {userProfile.town}, {userProfile.region}
                      </span>
                    </div>
                  )}
                  <Button asChild className="w-full max-w-sm">
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Post Button (Floating) */}
      <Button asChild size="icon" className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg md:right-8">
        <Link href="/upload">
          <PlusCircle className="h-6 w-6" />
        </Link>
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("home")}
            className={activeTab === "home" ? "text-primary" : "text-muted-foreground"}
          >
            <Home className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("explore")}
            className={activeTab === "explore" ? "text-primary" : "text-muted-foreground"}
          >
            <Compass className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("messages")}
            className={activeTab === "messages" ? "text-primary" : "text-muted-foreground"}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("profile")}
            className={activeTab === "profile" ? "text-primary" : "text-muted-foreground"}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </div>
  )
}

function VideoPost({ video, userId }: { video: any; userId: string }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.like_count || 0)

const handleLike = async () => {
  try {
    const app = getFirebaseApp()
    const { getFirestore, doc, updateDoc, increment, addDoc, collection, deleteDoc, query, where, getDocs } = await import("firebase/firestore")
    const db = getFirestore(app)

    if (liked) {
      const likesQuery = query(
        collection(db, "video_likes"),
        where("video_id", "==", video.id),
        where("user_id", "==", userId),
      )
      const snapshot = await getDocs(likesQuery)

      // Wait for all deletions to complete before updating like count
      const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref))
      await Promise.all(deletePromises)

      await updateDoc(doc(db, "videos", video.id), {
        like_count: increment(-1),
      })
      setLiked(false)
      setLikeCount((prev) => prev - 1) // Use functional update to avoid stale closure
    } else {
      await addDoc(collection(db, "video_likes"), {
        video_id: video.id,
        user_id: userId,
        created_at: new Date(),
      })

      await updateDoc(doc(db, "videos", video.id), {
        like_count: increment(1),
      })
      setLiked(true)
      setLikeCount((prev) => prev + 1) // Use functional update to avoid stale closure
    }
  } catch (error) {
    console.error("[v0] Error toggling like:", error)
  }
}

  const profile = video.profiles

  return (
    <div className="relative h-[calc(100vh-8rem)] snap-start bg-card">
      {/* Video Background */}
      <div className="absolute inset-0">
        {video.video_url ? (
          <video src={video.video_url} className="h-full w-full object-cover" controls loop />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <Trophy className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="mb-4 flex items-start gap-3">
          <Link href={`/profile/${profile?.id}`}>
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarImage src={profile?.profile_image_url || "/placeholder.svg"} />
              <AvatarFallback>{profile?.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/${profile?.id}`}>
                <p className="font-semibold hover:underline">{profile?.display_name || "User"}</p>
              </Link>
              <Badge variant="secondary" className="text-xs capitalize">
                {profile?.role || "player"}
              </Badge>
            </div>
            {profile?.town && profile?.region && (
              <div className="flex items-center gap-1 text-sm opacity-90">
                <MapPin className="h-3 w-3" />
                <span>
                  {profile.town}, {profile.region}
                </span>
              </div>
            )}
            <p className="mt-2 text-sm">{video.title}</p>
            {video.description && <p className="mt-1 text-sm opacity-90">{video.description}</p>}
          </div>
        </div>
      </div>

      {/* Action Buttons (Right Side) */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white">
          <div className={`rounded-full p-2 ${liked ? "bg-destructive" : "bg-black/40"}`}>
            <Heart className={`h-6 w-6 ${liked ? "fill-white" : ""}`} />
          </div>
          <span className="text-xs font-medium">{likeCount}</span>
        </button>
        <Link href={`/video/${video.id}`} className="flex flex-col items-center gap-1 text-white">
          <div className="rounded-full bg-black/40 p-2">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">{video.comment_count || 0}</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="rounded-full bg-black/40 p-2">
            <Share2 className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>
    </div>
  )
}
