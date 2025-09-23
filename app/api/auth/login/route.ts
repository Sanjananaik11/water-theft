import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login API called")
    const { email, password } = await request.json()

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] Attempting login for:", email)
    const result = await authService.login({ email, password })

    if (!result) {
      console.log("[v0] Login failed - invalid credentials")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Login successful, setting cookie")
    // Set session cookie
    const response = NextResponse.json({
      success: true,
      employee: result.employee,
    })

    response.cookies.set("session_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("[v0] Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
