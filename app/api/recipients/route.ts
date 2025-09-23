import { type NextRequest, NextResponse } from "next/server"

interface Recipient {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  groups: ("officials" | "residents" | "maintenance" | "emergency")[]
  active: boolean
  createdAt: string
  lastNotified?: string
}

// Mock recipient database (in real system, would use database)
const recipientsStorage: Recipient[] = [
  {
    id: "R001",
    name: "Panchayat President",
    email: "president@kandavara.gov.in",
    phone: "+91-9876543210",
    whatsapp: "+91-9876543210",
    groups: ["officials", "emergency"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    lastNotified: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: "R002",
    name: "Water Department Head",
    email: "water@kandavara.gov.in",
    phone: "+91-9876543211",
    whatsapp: "+91-9876543211",
    groups: ["officials", "maintenance"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    lastNotified: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: "R003",
    name: "Field Engineer",
    email: "field@kandavara.gov.in",
    phone: "+91-9876543212",
    whatsapp: "+91-9876543212",
    groups: ["maintenance", "emergency"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    lastNotified: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
  },
  {
    id: "R004",
    name: "Emergency Response Team",
    email: "emergency@kandavara.gov.in",
    phone: "+91-9876543213",
    whatsapp: "+91-9876543213",
    groups: ["emergency"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "R005",
    name: "Resident Representative",
    email: "residents@kandavara.gov.in",
    phone: "+91-9876543214",
    whatsapp: "+91-9876543214",
    groups: ["residents"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "R006",
    name: "Ward Member 1",
    email: "ward1@kandavara.gov.in",
    phone: "+91-9876543215",
    groups: ["officials", "residents"],
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "R007",
    name: "Ward Member 2",
    email: "ward2@kandavara.gov.in",
    phone: "+91-9876543216",
    groups: ["officials", "residents"],
    active: false, // Inactive recipient
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]

// Generate unique recipient ID
const generateRecipientId = (): string => {
  return "R" + Date.now().toString().slice(-6)
}

// GET - Retrieve recipients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const group = searchParams.get("group")
    const active = searchParams.get("active")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredRecipients = [...recipientsStorage]

    // Apply filters
    if (group) {
      filteredRecipients = filteredRecipients.filter((r) => r.groups.includes(group as any))
    }

    if (active !== null) {
      const isActive = active === "true"
      filteredRecipients = filteredRecipients.filter((r) => r.active === isActive)
    }

    // Sort by name
    filteredRecipients.sort((a, b) => a.name.localeCompare(b.name))

    // Apply limit
    filteredRecipients = filteredRecipients.slice(0, limit)

    // Get group statistics
    const groupStats = {
      officials: recipientsStorage.filter((r) => r.active && r.groups.includes("officials")).length,
      residents: recipientsStorage.filter((r) => r.active && r.groups.includes("residents")).length,
      maintenance: recipientsStorage.filter((r) => r.active && r.groups.includes("maintenance")).length,
      emergency: recipientsStorage.filter((r) => r.active && r.groups.includes("emergency")).length,
      total: recipientsStorage.filter((r) => r.active).length,
    }

    return NextResponse.json({
      success: true,
      recipients: filteredRecipients,
      total: filteredRecipients.length,
      groupStats,
      filters: { group, active, limit },
    })
  } catch (error) {
    console.error("Error retrieving recipients:", error)
    return NextResponse.json({ error: "Failed to retrieve recipients" }, { status: 500 })
  }
}

// POST - Add new recipient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.groups || body.groups.length === 0) {
      return NextResponse.json({ error: "Missing required fields: name, groups" }, { status: 400 })
    }

    // Validate at least one contact method
    if (!body.email && !body.phone && !body.whatsapp) {
      return NextResponse.json(
        { error: "At least one contact method (email, phone, whatsapp) is required" },
        { status: 400 },
      )
    }

    // Create new recipient
    const recipient: Recipient = {
      id: generateRecipientId(),
      name: body.name,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      groups: body.groups,
      active: body.active !== false, // Default to true
      createdAt: new Date().toISOString(),
    }

    recipientsStorage.push(recipient)

    return NextResponse.json({
      success: true,
      recipient,
    })
  } catch (error) {
    console.error("Error adding recipient:", error)
    return NextResponse.json({ error: "Failed to add recipient" }, { status: 500 })
  }
}
