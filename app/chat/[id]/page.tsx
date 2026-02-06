"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Phone, Info } from "lucide-react"
import { getFirebaseApp } from "@/lib/firebase/config"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  created_at: any
  read: boolean
}

interface UserProfile {
  id: string
  display_name: string
  profile_image_url?: string
  role: string
}

interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: any
  last_message_text?: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
          loadConversation(currentUser.uid)
        }
      })
    }

    initAuth()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router, conversationId])

  const loadConversation = async (userId: string) => {
    try {
      const app = getFirebaseApp()
      const { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } = await import(
        "firebase/firestore"
      )
      const db = getFirestore(app)

      // Load conversation
      const conversationDoc = await getDoc(doc(db, "chat_conversations", conversationId))
      if (!conversationDoc.exists()) {
        setError("Conversation not found")
        setIsLoading(false)
        return
      }

      const conversationData: Conversation = { id: conversationDoc.id, ...conversationDoc.data() } as Conversation
      
      // Verify current user is participant
      if (
        conversationData.participant_1_id !== userId &&
        conversationData.participant_2_id !== userId
      ) {
        setError("Unauthorized access to this conversation")
        setIsLoading(false)
        return
      }

      setConversation(conversationData)

      // Determine other user ID
      const otherUserId =
        conversationData.participant_1_id === userId
          ? conversationData.participant_2_id
          : conversationData.participant_1_id

      // Load other user profile
      const otherUserDoc = await getDoc(doc(db, "profiles", otherUserId))
      if (otherUserDoc.exists()) {
        setOtherUser({ id: otherUserDoc.id, ...otherUserDoc.data() } as UserProfile)
      }

      // Load messages
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversation_id", "==", conversationId),
        orderBy("created_at", "asc")
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      
      const messagesData: Message[] = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message))

      setMessages(messagesData)

      // Mark messages as read
      const { writeBatch } = await import("firebase/firestore")
      const wb = writeBatch(db)

      messagesData.forEach((msg) => {
        if (msg.sender_id !== userId && !msg.read) {
          wb.update(doc(db, "messages", msg.id), { read: true })
        }
      })

      await wb.commit()

      // Update conversation last view
      await updateDoc(doc(db, "chat_conversations", conversationId), {
        last_viewed_at: new Date(),
      })
    } catch (err) {
      console.error("[v0] Error loading conversation:", err)
      setError("Failed to load conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || !conversation) return

    setIsSending(true)
    try {
      const app = getFirebaseApp()
      const { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      )
      const db = getFirestore(app)

      // Add message
      await addDoc(collection(db, "messages"), {
        conversation_id: conversationId,
        sender_id: user.uid,
        text: newMessage,
        created_at: serverTimestamp(),
        read: false,
      })

      // Update conversation
      await updateDoc(doc(db, "chat_conversations", conversationId), {
        last_message_text: newMessage,
        last_message_at: serverTimestamp(),
      })

      // Add to local state
      const newMessageObj: Message = {
        id: Math.random().toString(),
        conversation_id: conversationId,
        sender_id: user.uid,
        text: newMessage,
        created_at: new Date(),
        read: false,
      }

      setMessages([...messages, newMessageObj])
      setNewMessage("")
    } catch (err) {
      console.error("[v0] Message error:", err)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error || !conversation || !otherUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Conversation not found"}</p>
        <Link href="/chat">
          <Button variant="outline">Back to Messages</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={otherUser.profile_image_url} alt={otherUser.display_name} />
                <AvatarFallback>{otherUser.display_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{otherUser.display_name}</p>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser.profile_image_url} alt={otherUser.display_name} />
              <AvatarFallback>{otherUser.display_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold">{otherUser.display_name}</p>
              <p className="text-sm text-muted-foreground">Start a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.uid
              const showAvatar =
                index === 0 ||
                messages[index - 1].sender_id !== message.sender_id

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"} ${
                    !showAvatar && isOwnMessage ? "ml-12" : ""
                  }`}
                >
                  {!isOwnMessage && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={otherUser.profile_image_url} alt={otherUser.display_name} />
                      <AvatarFallback>{otherUser.display_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-8" />}

                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm break-words">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at?.toDate?.() || message.created_at).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
