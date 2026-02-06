"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFirebaseApp } from "@/lib/firebase/config"
import FeedClient from "@/components/feed-client"

export default function FeedPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
          await loadData(currentUser.uid)
        }
      })
    }
    
    initAuth()
    
    return () => { if (unsubscribe) unsubscribe() }
  }, [router])

  const loadData = async (userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } = await import("firebase/firestore")
      const db = getFirestore(app)

      // Add timeout to handle offline scenarios
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firebase operation timed out. Please check your internet connection.")), 10000)
      )

      try {
        const profileDoc = await Promise.race([getDoc(doc(db, "profiles", userId)), timeoutPromise])
        if (profileDoc.exists()) {
          setUserProfile({ id: profileDoc.id, ...profileDoc.data() })
        }

        const videosQuery = query(collection(db, "videos"), orderBy("created_at", "desc"), limit(20))
        const videosSnapshot = await Promise.race([getDocs(videosQuery), timeoutPromise])

        const videosData = await Promise.all(
          videosSnapshot.docs.map(async (videoDoc) => {
            const videoData: any = { id: videoDoc.id, ...videoDoc.data() }

            // Fetch profile for each video
            const profileDocRef = await getDoc(doc(db, "profiles", videoData.user_id))
            if (profileDocRef.exists()) {
              videoData.profiles = { id: profileDocRef.id, ...profileDocRef.data() }
            }

            return videoData
          }),
        )

        setVideos(videosData)
      } catch (timeoutError) {
        console.warn("Network timeout - data may be loaded from offline cache", timeoutError)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      // Show empty state instead of crashing
      setVideos([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <FeedClient videos={videos} userProfile={userProfile} userId={user?.uid || ""} />
}
