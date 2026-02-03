import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Firebase auth is handled client-side, so we just pass through
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/upload/:path*",
    "/profile/:path*",
    "/chat/:path*",
    "/search/:path*",
    "/saved/:path*",
    "/notifications/:path*",
  ],
}
