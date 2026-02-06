"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Trophy } from "lucide-react"
import { getFirebaseApp } from "@/lib/firebase/config"

interface Video {
  id: string
  user_id: string
  title: string
  description: string
  video_url: string
  thumbnail_url?: string
  duration_seconds?: number
  position?: string
  region?: string
  town?: string
  like_count: number
  comment_count: number
  view_count: number
  created_at: any
  updated_at: any
}

interface UserProfile {
  id: string
  display_name: string
  profile_image_url?: string
  role: string
  followers_count?: number
}

interface Comment {
  id: string
  video_id: string
  user_id: string
  text: string
  created_at: any
  user?: {
    display_name: string
    profile_image_url?: string
  }
}

export default function VideoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [creator, setCreator] = useState<UserProfile | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth and load data
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
          loadVideoData(currentUser.uid)
        }
      })
    }

    initAuth()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router, videoId])

  const loadVideoData = async (userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } = await import(
        "firebase/firestore"
      )
      const db = getFirestore(app)

      // Load video
      const videoDoc = await getDoc(doc(db, "videos", videoId))
      if (!videoDoc.exists()) {
        setError("Video not found")
        setIsLoading(false)
        return
      }

      const videoData: Video = { id: videoDoc.id, ...videoDoc.data() } as Video
      setVideo(videoData)

      // Load creator profile
      const creatorDoc = await getDoc(doc(db, "profiles", videoData.user_id))
      if (creatorDoc.exists()) {
        setCreator({ id: creatorDoc.id, ...creatorDoc.data() } as UserProfile)
      }

      // Load comments
      const commentsQuery = query(
        collection(db, "comments"),
        where("video_id", "==", videoId),
        orderBy("created_at", "desc")
      )
      const commentsSnapshot = await getDocs(commentsQuery)
      
      const commentsData: Comment[] = []
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData: Comment = { id: commentDoc.id, ...commentDoc.data() } as Comment
        
        // Load comment author profile
        const commentAuthorDoc = await getDoc(doc(db, "profiles", commentData.user_id))
        if (commentAuthorDoc.exists()) {
          commentData.user = {
            display_name: commentAuthorDoc.data().display_name,
            profile_image_url: commentAuthorDoc.data().profile_image_url,
          }
        }
        
        commentsData.push(commentData)
      }
      setComments(commentsData)

      // Check if user liked this video
      const likeQuery = query(
        collection(db, "video_likes"),
        where("video_id", "==", videoId),
        where("user_id", "==", userId)
      )
      const likeSnapshot = await getDocs(likeQuery)
      setIsLiked(!likeSnapshot.empty)

      // Check if user follows creator
      const followQuery = query(
        collection(db, "follows"),
        where("follower_id", "==", userId),
        where("following_id", "==", videoData.user_id)
      )
      const followSnapshot = await getDocs(followQuery)
      setIsFollowing(!followSnapshot.empty)

      // Increment view count
      const { updateDoc, increment } = await import("firebase/firestore")
      await updateDoc(doc(db, "videos", videoId), {
        view_count: increment(1),
      })
      videoData.view_count += 1
      setVideo(videoData)
    } catch (err) {
      console.error("[v0] Error loading video:", err)
      setError("Failed to load video")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !video) return

    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, addDoc, deleteDoc, query, where, getDocs, doc, updateDoc, increment } =
        await import("firebase/firestore")
      const db = getFirestore(app)

      if (isLiked) {
        // Unlike: delete like document
        const likeQuery = query(
          collection(db, "video_likes"),
          where("video_id", "==", videoId),
          where("user_id", "==", user.uid)
        )
        const likeSnapshot = await getDocs(likeQuery)
        
        for (const likeDoc of likeSnapshot.docs) {
          await deleteDoc(likeDoc.ref)
        }

        // Decrement like count
        await updateDoc(doc(db, "videos", videoId), {
          like_count: increment(-1),
        })

        setIsLiked(false)
        setVideo((prev) => ({ ...prev, like_count: prev.like_count - 1 }))
      } else {
        // Like: add like document
        await addDoc(collection(db, "video_likes"), {
          video_id: videoId,
          user_id: user.uid,
          created_at: new Date(),
        })

        // Increment like count
        await updateDoc(doc(db, "videos", videoId), {
          like_count: increment(1),
        })

        setIsLiked(true)
        setVideo((prev) => ({ ...prev, like_count: prev.like_count + 1 }))
      }
    } catch (err) {
      console.error("[v0] Like error:", err)
    }
  }

  const handleFollow = async () => {
    if (!user || !video) return

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
          where("following_id", "==", video.user_id)
        )
        const followSnapshot = await getDocs(followQuery)

        for (const followDoc of followSnapshot.docs) {
          await deleteDoc(followDoc.ref)
        }

        // Decrement follower count for creator and following count for current user
        await updateDoc(doc(db, "profiles", video.user_id), {
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
          following_id: video.user_id,
          created_at: new Date(),
        })

        // Increment follower count for creator and following count for current user
        await updateDoc(doc(db, "profiles", video.user_id), {
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || !video) return

    setIsSubmittingComment(true)
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp } = await import(
        "firebase/firestore"
      )
      const db = getFirestore(app)

      // Add comment
      const commentRef = await addDoc(collection(db, "comments"), {
        video_id: videoId,
        user_id: user.uid,
        text: newComment,
        created_at: serverTimestamp(),
      })

      // Increment comment count
      await updateDoc(doc(db, "videos", videoId), {
        comment_count: increment(1),
      })

      // Get user profile for display
      const userDoc = await getDoc(doc(db, "profiles", user.uid))
      const userData = userDoc.data()

      // Add new comment to local state
      const newCommentObj: Comment = {
        id: commentRef.id,
        video_id: videoId,
        user_id: user.uid,
        text: newComment,
        created_at: new Date(),
        user: {
          display_name: userData?.display_name || "Unknown",
          profile_image_url: userData?.profile_image_url,
        },
      }

      setComments((prev) => [newCommentObj, ...prev])
      setVideo((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }))
      setNewComment("")
    } catch (err) {
      console.error("[v0] Comment error:", err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Video not found"}</p>
        <Link href="/feed">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Video</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        {/* Video Player */}
        <div className="mb-6 rounded-lg overflow-hidden bg-black">
          <video
            src={video.video_url}
            controls
            className="w-full aspect-video object-cover"
            controlsList="nodownload"
          />
        </div>

        {/* Video Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Title and Description */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">{video.title}</h1>
                {video.description && <p className="text-muted-foreground">{video.description}</p>}

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {video.position && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {video.position}
                    </Badge>
                  )}
                  {video.region && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {video.region}
                      {video.town && `, ${video.town}`}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
                  <div>{video.view_count.toLocaleString()} views</div>
                  <div>{video.like_count.toLocaleString()} likes</div>
                  <div>{video.comment_count} comments</div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Card */}
            {creator && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <Link href={`/profile/${creator.id}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.profile_image_url} alt={creator.display_name} />
                        <AvatarFallback>{creator.display_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{creator.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {creator.followers_count?.toLocaleString() || 0} followers
                        </p>
                      </div>
                    </Link>
                    {user?.uid !== creator.id && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={handleFollow}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                Like ({video.like_count})
              </Button>
              <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comment ({video.comment_count})
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Comments ({comments.length})</h2>

              {/* Comment Input */}
              {user && (
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} alt="You" />
                          <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewComment("")}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newComment.trim() || isSubmittingComment}
                        >
                          {isSubmittingComment ? "Posting..." : "Comment"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user?.profile_image_url} alt={comment.user?.display_name} />
                            <AvatarFallback>{comment.user?.display_name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{comment.user?.display_name || "Unknown"}</p>
                            <p className="text-sm text-foreground mt-1">{comment.text}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(comment.created_at?.toDate?.() || comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos (placeholder) */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">More from creator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Related videos coming soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
