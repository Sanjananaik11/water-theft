import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const employee = await authService.verifySession(sessionToken)

    if (!employee) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error) {
    console.error("[API] Session verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
