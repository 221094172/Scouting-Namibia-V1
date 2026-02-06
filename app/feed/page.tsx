"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import FeedClient from "@/components/feed-client"

export default function FeedPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/auth/login")
      } else {
        setUser(session.user)
        await loadData(session.user.id)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push("/auth/login")
      } else {
        setUser(session.user)
        await loadData(session.user.id)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const loadData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.warn("Profile fetch error:", profileError)
      } else {
        setUserProfile(profileData)
      }

      // Fetch videos with related profile data
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select(
          `*,
          profiles (
            id,
            display_name,
            profile_image_url,
            bio,
            region,
            town
          )`
        )
        .order("created_at", { ascending: false })
        .limit(20)

      if (videosError) {
        console.error("[v0] Error loading videos:", videosError)
        setVideos([])
      } else {
        setVideos(videosData || [])
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setVideos([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <FeedClient videos={videos} userProfile={userProfile} userId={user?.id || ""} />
}
