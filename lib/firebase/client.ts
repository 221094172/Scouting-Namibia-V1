"use client"

// Re-export the getter functions from config
export { getFirebaseAuth, getFirebaseDb, getFirebaseStorage, getFirebaseApp } from "./config"

// Helper function to get all Firebase services at once
export function getFirebaseClient() {
  // Import dynamically to avoid circular dependencies
  const { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } = require("./config") as typeof import("./config")
  return { 
    auth: getFirebaseAuth(), 
    db: getFirebaseDb(), 
    storage: getFirebaseStorage() 
  }
}
