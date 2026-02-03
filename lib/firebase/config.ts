import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrcRvK13uGE8YWYpK43r-0jimY6YbU_bQ",
  authDomain: "hockeyunionapp.firebaseapp.com",
  projectId: "hockeyunionapp",
  storageBucket: "hockeyunionapp.firebasestorage.app",
  messagingSenderId: "868368032899",
  appId: "1:868368032899:web:737d2bb51c35edfb4627b6",
  measurementId: "G-SQGVW39PCF",
}

// Initialize Firebase App IMMEDIATELY at module load time
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

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
