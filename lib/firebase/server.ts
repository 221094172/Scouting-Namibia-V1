import { auth, db, storage } from "./config"

export { auth, db, storage }

export function getFirebaseServer() {
  return { auth, db, storage }
}
