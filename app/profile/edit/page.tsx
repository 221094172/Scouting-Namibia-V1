"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProfileEditForm from "@/components/profile-edit-form"
import { getFirebaseApp } from "@/lib/firebase/config"

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [roleData, setRoleData] = useState<any>(null)
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
          await loadProfileData(currentUser.uid)
        }
      })
    }
    
    initAuth()
    return () => { if (unsubscribe) unsubscribe() }
  }, [router])

  const loadProfileData = async (userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, doc, getDoc } = await import("firebase/firestore")
      const db = getFirestore(app)
      const profileDoc = await getDoc(doc(db, "profiles", userId))

      if (!profileDoc.exists()) {
        router.push("/auth/login")
        return
      }

      const profileData = { id: profileDoc.id, ...profileDoc.data() }
      setProfile(profileData)

      // Fetch role-specific data
      let roleDataResult = null
      if (profileData.role === "player") {
        const playerDoc = await getDoc(doc(db, "player_profiles", userId))
        roleDataResult = playerDoc.exists() ? { id: playerDoc.id, ...playerDoc.data() } : null
      } else if (profileData.role === "coach") {
        const coachDoc = await getDoc(doc(db, "coach_profiles", userId))
        roleDataResult = coachDoc.exists() ? { id: coachDoc.id, ...coachDoc.data() } : null
      } else if (profileData.role === "club") {
        const clubDoc = await getDoc(doc(db, "club_profiles", userId))
        roleDataResult = clubDoc.exists() ? { id: clubDoc.id, ...clubDoc.data() } : null
      }
      setRoleData(roleDataResult)
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      <ProfileEditForm profile={profile} roleData={roleData} />
    </div>
  )
}
