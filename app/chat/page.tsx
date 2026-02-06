"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getFirebaseApp } from "@/lib/firebase/config"

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userParam = searchParams.get("user") // Get user param to start conversation
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
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
          // If user param is provided, try to start or find conversation with that user
          if (userParam) {
            await handleStartConversation(currentUser.uid, userParam)
          } else {
            await loadConversations(currentUser.uid)
          }
        }
      })
    }

    initAuth()
    return () => { if (unsubscribe) unsubscribe() }
  }, [router, userParam])

  const loadConversations = async (userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc, or } = await import("firebase/firestore")
      const db = getFirestore(app)
      const conversationsQuery = query(
        collection(db, "chat_conversations"),
        or(where("participant_1_id", "==", userId), where("participant_2_id", "==", userId)),
        orderBy("last_message_at", "desc"),
      )

      const snapshot = await getDocs(conversationsQuery)
      const conversationsData = await Promise.all(
        snapshot.docs.map(async (convDoc) => {
          const convData = { id: convDoc.id, ...convDoc.data() }

          // Fetch participant profiles
          const participant1Doc = await getDoc(doc(db, "profiles", convData.participant_1_id))
          const participant2Doc = await getDoc(doc(db, "profiles", convData.participant_2_id))

          convData.participant_1 = participant1Doc.exists()
            ? { id: participant1Doc.id, ...participant1Doc.data() }
            : null
          convData.participant_2 = participant2Doc.exists()
            ? { id: participant2Doc.id, ...participant2Doc.data() }
            : null

          return convData
        }),
      )

      setConversations(conversationsData)
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/feed">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {conversations && conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const otherUser = conv.participant_1_id === user.uid ? conv.participant_2 : conv.participant_1
              return (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={otherUser?.profile_image_url || "/placeholder.svg"} />
                          <AvatarFallback>{otherUser?.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{otherUser?.display_name || "User"}</p>
                          <p className="text-sm text-muted-foreground capitalize">{otherUser?.role || "User"}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conv.last_message_at && new Date(conv.last_message_at.toDate()).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Start connecting with players, coaches, and clubs
              </p>
              <Button asChild>
                <Link href="/feed">Explore Feed</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
