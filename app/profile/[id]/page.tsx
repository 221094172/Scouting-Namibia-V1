"use client"

import { useState, useEffect } from "react"
import { useRouter, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Mail, Phone, Edit, MessageCircle, Bookmark, Trophy, Video, Eye, Users } from "lucide-react"
import Link from "next/link"
import { getFirebaseApp } from "@/lib/firebase/config"

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [roleData, setRoleData] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [savedPlayer, setSavedPlayer] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileId, setProfileId] = useState<string>("")

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setProfileId(resolvedParams.id)
    }
    initParams()
  }, [params])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const initAuth = async () => {
      const app = getFirebaseApp()
      const { getAuth, onAuthStateChanged } = await import("firebase/auth")
      const auth = getAuth(app)
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          router.push("/auth/login")
        } else {
          setUser(currentUser)
          if (profileId) {
            await loadProfileData(profileId, currentUser.uid)
          }
        }
      })
    }
    
    initAuth()
    return () => { if (unsubscribe) unsubscribe() }
  }, [router, profileId])

  const loadProfileData = async (id: string, userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore")
      const db = getFirestore(app)
      const profileDoc = await getDoc(doc(db, "profiles", id))

      if (!profileDoc.exists()) {
        notFound()
        return
      }

      const profileData = { id: profileDoc.id, ...profileDoc.data() }
      setProfile(profileData)

      // Fetch role-specific data
      let roleDataResult = null
      if (profileData.role === "player") {
        const playerDoc = await getDoc(doc(db, "player_profiles", id))
        roleDataResult = playerDoc.exists() ? { id: playerDoc.id, ...playerDoc.data() } : null
      } else if (profileData.role === "coach") {
        const coachDoc = await getDoc(doc(db, "coach_profiles", id))
        roleDataResult = coachDoc.exists() ? { id: coachDoc.id, ...coachDoc.data() } : null
      } else if (profileData.role === "club") {
        const clubDoc = await getDoc(doc(db, "club_profiles", id))
        roleDataResult = clubDoc.exists() ? { id: clubDoc.id, ...clubDoc.data() } : null
      }
      setRoleData(roleDataResult)

      // Fetch user's videos
      const videosQuery = query(
        collection(db, "videos"),
        where("user_id", "==", id),
        orderBy("created_at", "desc"),
        limit(6),
      )
      const videosSnapshot = await getDocs(videosQuery)
      const videosData = videosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setVideos(videosData)

      // Check if current user has saved this player
      const savedQuery = query(
        collection(db, "saved_players"),
        where("user_id", "==", userId),
        where("player_id", "==", id),
      )
      const savedSnapshot = await getDocs(savedQuery)
      setSavedPlayer(savedSnapshot.empty ? null : { id: savedSnapshot.docs[0].id })

      // Check if current user is following this user
      const followsQuery = query(
        collection(db, "follows"),
        where("follower_id", "==", userId),
        where("following_id", "==", id),
      )
      const followsSnapshot = await getDocs(followsQuery)
      setIsFollowing(followsSnapshot.empty ? null : { id: followsSnapshot.docs[0].id })
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, addDoc, deleteDoc, query, where, getDocs, doc, updateDoc, increment } =
        await import("firebase/firestore")
      const db = getFirestore(app)

      if (isFollowing) {
        // Unfollow
        const followQuery = query(
          collection(db, "follows"),
          where("follower_id", "==", user.uid),
          where("following_id", "==", profileId)
        )
        const followSnapshot = await getDocs(followQuery)

        for (const followDoc of followSnapshot.docs) {
          await deleteDoc(followDoc.ref)
        }

        // Decrement follower count for creator and following count for current user
        await updateDoc(doc(db, "profiles", profileId), {
          followers_count: increment(-1),
        })
        await updateDoc(doc(db, "profiles", user.uid), {
          following_count: increment(-1),
        })

        setIsFollowing(false)
      } else {
        // Follow
        await addDoc(collection(db, "follows"), {
          follower_id: user.uid,
          following_id: profileId,
          created_at: new Date(),
        })

        // Increment follower count for creator and following count for current user
        await updateDoc(doc(db, "profiles", profileId), {
          followers_count: increment(1),
        })
        await updateDoc(doc(db, "profiles", user.uid), {
          following_count: increment(1),
        })

        setIsFollowing(true)
      }
    } catch (err) {
      console.error("[v0] Follow error:", err)
    }
  }

  const handleSavePlayer = async () => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, addDoc, deleteDoc, query, where, getDocs, doc } =
        await import("firebase/firestore")
      const db = getFirestore(app)

      if (savedPlayer) {
        // Unsave player
        const saveQuery = query(
          collection(db, "saved_players"),
          where("user_id", "==", user.uid),
          where("player_id", "==", profileId)
        )
        const saveSnapshot = await getDocs(saveQuery)

        for (const saveDoc of saveSnapshot.docs) {
          await deleteDoc(saveDoc.ref)
        }

        setSavedPlayer(null)
      } else {
        // Save player
        await addDoc(collection(db, "saved_players"), {
          user_id: user.uid,
          player_id: profileId,
          created_at: new Date(),
        })

        setSavedPlayer(true)
      }
    } catch (err) {
      console.error("[v0] Save player error:", err)
    }
  }

  if (isLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const isOwnProfile = user?.uid === profileId

  const initials = profile.display_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Cover */}
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-amber-500" />

      <div className="container mx-auto px-4 pb-12">
        {/* Profile Card */}
        <div className="relative -mt-24 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={profile.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold">
                          {profile.role === "club" && roleData ? roleData.club_name : profile.display_name}
                        </h1>
                        <Badge variant="secondary" className="capitalize">
                          {profile.role}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        {profile.region && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {profile.town}, {profile.region}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{profile.email}</span>
                        </div>
                        {profile.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{profile.phone_number}</span>
                          </div>
                        )}
                      </div>

                      {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}

                      {/* Player-specific stats */}
                      {profile.role === "player" && roleData && (
                        <div className="flex flex-wrap gap-4 text-sm">
                          {roleData.position && (
                            <div>
                              <span className="text-muted-foreground">Position:</span>{" "}
                              <span className="font-medium">{roleData.position}</span>
                            </div>
                          )}
                          {roleData.age && (
                            <div>
                              <span className="text-muted-foreground">Age:</span>{" "}
                              <span className="font-medium">{roleData.age}</span>
                            </div>
                          )}
                          {roleData.height_cm && (
                            <div>
                              <span className="text-muted-foreground">Height:</span>{" "}
                              <span className="font-medium">{roleData.height_cm} cm</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coach-specific info */}
                      {profile.role === "coach" && roleData && (
                        <div className="flex flex-wrap gap-4 text-sm">
                          {roleData.specialization && (
                            <div>
                              <span className="text-muted-foreground">Specialization:</span>{" "}
                              <span className="font-medium">{roleData.specialization}</span>
                            </div>
                          )}
                          {roleData.years_experience && (
                            <div>
                              <span className="text-muted-foreground">Experience:</span>{" "}
                              <span className="font-medium">{roleData.years_experience} years</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button asChild>
                          <Link href="/profile/edit">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild>
                            <Link href={`/chat?user=${profileId}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Link>
                          </Button>
                          {profile.role === "player" && (
                            <Button variant="outline" onClick={handleSavePlayer}>
                              <Bookmark className={`h-4 w-4 mr-2 ${savedPlayer ? "fill-current" : ""}`} />
                              {savedPlayer ? "Saved" : "Save"}
                            </Button>
                          )}
                          <Button variant="outline" onClick={handleFollow}>
                            <Users className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                            {isFollowing ? "Following" : "Follow"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {profile.role === "player" && roleData && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                          <Video className="h-5 w-5" />
                          {roleData.video_count || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                          <Eye className="h-5 w-5" />
                          {roleData.profile_views || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                          <Users className="h-5 w-5" />
                          {roleData.follower_count || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            {profile.role === "player" && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
            {profile.role === "club" && <TabsTrigger value="vacancies">Vacancies</TabsTrigger>}
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            {videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
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
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor((video.duration_seconds || 0) / 60)}:
                          {String((video.duration_seconds || 0) % 60).padStart(2, "0")}
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {video.view_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {video.like_count}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No videos yet</p>
                  {isOwnProfile && (
                    <Button asChild className="mt-4">
                      <Link href="/upload">Upload Your First Video</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="font-medium mb-2">Bio</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile.role === "player" && roleData && (
                  <div className="grid gap-4">
                    {roleData.current_club && (
                      <div>
                        <h3 className="font-medium mb-1">Current Club</h3>
                        <p className="text-muted-foreground">{roleData.current_club}</p>
                      </div>
                    )}
                    {roleData.preferred_foot && (
                      <div>
                        <h3 className="font-medium mb-1">Preferred Foot</h3>
                        <p className="text-muted-foreground capitalize">{roleData.preferred_foot}</p>
                      </div>
                    )}
                    {roleData.weight_kg && (
                      <div>
                        <h3 className="font-medium mb-1">Weight</h3>
                        <p className="text-muted-foreground">{roleData.weight_kg} kg</p>
                      </div>
                    )}
                    {roleData.experience_years && (
                      <div>
                        <h3 className="font-medium mb-1">Experience</h3>
                        <p className="text-muted-foreground">{roleData.experience_years} years</p>
                      </div>
                    )}
                  </div>
                )}

                {profile.role === "coach" && roleData && (
                  <div className="grid gap-4">
                    {roleData.coaching_license && (
                      <div>
                        <h3 className="font-medium mb-1">Coaching License</h3>
                        <p className="text-muted-foreground">{roleData.coaching_license}</p>
                      </div>
                    )}
                    {roleData.current_club && (
                      <div>
                        <h3 className="font-medium mb-1">Current Club</h3>
                        <p className="text-muted-foreground">{roleData.current_club}</p>
                      </div>
                    )}
                  </div>
                )}

                {profile.role === "club" && roleData && (
                  <div className="grid gap-4">
                    {roleData.founded_year && (
                      <div>
                        <h3 className="font-medium mb-1">Founded</h3>
                        <p className="text-muted-foreground">{roleData.founded_year}</p>
                      </div>
                    )}
                    {roleData.league && (
                      <div>
                        <h3 className="font-medium mb-1">League</h3>
                        <p className="text-muted-foreground">{roleData.league}</p>
                      </div>
                    )}
                    {roleData.stadium && (
                      <div>
                        <h3 className="font-medium mb-1">Stadium</h3>
                        <p className="text-muted-foreground">{roleData.stadium}</p>
                      </div>
                    )}
                    {roleData.contact_person && (
                      <div>
                        <h3 className="font-medium mb-1">Contact Person</h3>
                        <p className="text-muted-foreground">{roleData.contact_person}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {profile.role === "player" && roleData && (
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  {roleData.achievements ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{roleData.achievements}</p>
                  ) : (
                    <p className="text-muted-foreground">No achievements listed yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {profile.role === "club" && (
            <TabsContent value="vacancies">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No vacancies at this time</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
