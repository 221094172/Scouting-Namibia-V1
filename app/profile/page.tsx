"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFirebaseApp } from "@/lib/firebase/config"

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const initAuth = async () => {
      const app = getFirebaseApp()
      const { getAuth, onAuthStateChanged } = await import("firebase/auth")
      const auth = getAuth(app)
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push("/auth/login")
        } else {
          // Redirect to user's own profile
          router.push(`/profile/${user.uid}`)
        }
      })
    }
    
    initAuth()
    return () => { if (unsubscribe) unsubscribe() }
  }, [router])

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}
