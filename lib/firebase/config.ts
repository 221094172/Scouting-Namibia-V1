import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration is incomplete. Please check your environment variables.")
}

// Initialize Firebase App IMMEDIATELY at module load time
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Enable offline persistence for Firestore
if (typeof window !== "undefined") {
  import("firebase/firestore").then(({ enableIndexedDbPersistence, getFirestore }) => {
    const db = getFirestore(app)
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, offline persistence disabled")
      } else if (err.code === "unimplemented") {
        console.warn("Browser doesn't support offline persistence")
      }
    })
  })
}

// Cached instances
let _auth: any = null
let _db: any = null
let _storage: any = null

export function getFirebaseApp(): FirebaseApp {
  return app
}

export async function getFirebaseAuth() {
  if (!_auth) {
    const { getAuth } = await import("firebase/auth")
    _auth = getAuth(app)
  }
  return _auth
}

export async function getFirebaseDb() {
  if (!_db) {
    const { getFirestore } = await import("firebase/firestore")
    _db = getFirestore(app)
  }
  return _db
}

export async function getFirebaseStorage() {
  if (!_storage) {
    const { getStorage } = await import("firebase/storage")
    _storage = getStorage(app)
  }
  return _storage
}
