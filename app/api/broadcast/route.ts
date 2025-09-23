import { type NextRequest, NextResponse } from "next/server"

// Types for broadcast messaging
interface BroadcastMessage {
  id: string
  title: string
  message: string
  priority: "low" | "medium" | "high" | "emergency"
  channels: ("email" | "sms" | "whatsapp")[]
  targetGroups: ("all" | "officials" | "residents" | "maintenance" | "emergency")[]
  sentBy: string
  timestamp: string
  recipientCount: number
  deliveryStatus: {
    sent: number
    delivered: number
    failed: number
  }
}

interface Recipient {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  groups: ("officials" | "residents" | "maintenance" | "emergency")[]
  active: boolean
}

// Mock recipient database
const recipientsStorage: Recipient[] = [
  {
    id: "R001",
    name: "Panchayat President",
    email: "president@kandavara.gov.in",
    phone: "+91-9876543210",
    whatsapp: "+91-9876543210",
    groups: ["officials", "emergency"],
    active: true,
  },
  {
    id: "R002",
    name: "Water Department Head",
    email: "water@kandavara.gov.in",
    phone: "+91-9876543211",
    whatsapp: "+91-9876543211",
    groups: ["officials", "maintenance"],
    active: true,
  },
  {
    id: "R003",
    name: "Field Engineer",
    email: "field@kandavara.gov.in",
    phone: "+91-9876543212",
    whatsapp: "+91-9876543212",
    groups: ["maintenance", "emergency"],
    active: true,
  },
  {
    id: "R004",
    name: "Emergency Response Team",
    email: "emergency@kandavara.gov.in",
    phone: "+91-9876543213",
    whatsapp: "+91-9876543213",
    groups: ["emergency"],
    active: true,
  },
  {
    id: "R005",
    name: "Resident Representative",
    email: "residents@kandavara.gov.in",
    phone: "+91-9876543214",
    whatsapp: "+91-9876543214",
    groups: ["residents"],
    active: true,
  },
]

// Mock broadcast history
const broadcastHistory: BroadcastMessage[] = [
  {
    id: "BC001",
    title: "Water Supply Maintenance",
    message:
      "Scheduled maintenance on main water line from 2 PM to 6 PM today. Water supply will be temporarily interrupted.",
    priority: "medium",
    channels: ["email", "sms", "whatsapp"],
    targetGroups: ["all"],
    sentBy: "admin@kandavara.gov.in",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    recipientCount: 5,
    deliveryStatus: {
      sent: 15,
      delivered: 14,
      failed: 1,
    },
  },
]

// Generate unique broadcast ID
const generateBroadcastId = (): string => {
  return "BC" + Date.now().toString().slice(-6)
}

// Get recipients based on target groups
const getTargetRecipients = (targetGroups: string[]): Recipient[] => {
  if (targetGroups.includes("all")) {
    return recipientsStorage.filter((r) => r.active)
  }

  return recipientsStorage.filter((r) => r.active && r.groups.some((group) => targetGroups.includes(group)))
}

// Send broadcast message (mock implementation)
const sendBroadcastMessage = async (
  message: BroadcastMessage,
  recipients: Recipient[],
): Promise<{ sent: number; delivered: number; failed: number }> => {
  let sent = 0
  let delivered = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      for (const channel of message.channels) {
        switch (channel) {
          case "email":
            if (recipient.email) {
              console.log(`[v0] Sending email to ${recipient.name} (${recipient.email}): ${message.title}`)
              sent++
              delivered++ // Mock successful delivery
            }
            break
          case "sms":
            if (recipient.phone) {
              console.log(`[v0] Sending SMS to ${recipient.name} (${recipient.phone}): ${message.message}`)
              sent++
              delivered++ // Mock successful delivery
            }
            break
          case "whatsapp":
            if (recipient.whatsapp) {
              console.log(`[v0] Sending WhatsApp to ${recipient.name} (${recipient.whatsapp}): ${message.message}`)
              sent++
              delivered++ // Mock successful delivery
            }
            break
        }
      }
    } catch (error) {
      console.error(`[v0] Failed to send to ${recipient.name}:`, error)
      failed++
    }
  }

  return { sent, delivered, failed }
}

// GET - Retrieve broadcast history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Sort by timestamp (newest first)
    const sortedHistory = [...broadcastHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    return NextResponse.json({
      success: true,
      broadcasts: sortedHistory.slice(0, limit),
      total: sortedHistory.length,
    })
  } catch (error) {
    console.error("Error retrieving broadcast history:", error)
    return NextResponse.json({ error: "Failed to retrieve broadcast history" }, { status: 500 })
  }
}

// POST - Send broadcast message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.message || !body.channels || !body.targetGroups) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, channels, targetGroups" },
        { status: 400 },
      )
    }

    // Get target recipients
    const recipients = getTargetRecipients(body.targetGroups)

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No active recipients found for target groups" }, { status: 400 })
    }

    // Create broadcast message
    const broadcast: BroadcastMessage = {
      id: generateBroadcastId(),
      title: body.title,
      message: body.message,
      priority: body.priority || "medium",
      channels: body.channels,
      targetGroups: body.targetGroups,
      sentBy: body.sentBy || "system@kandavara.gov.in",
      timestamp: new Date().toISOString(),
      recipientCount: recipients.length,
      deliveryStatus: { sent: 0, delivered: 0, failed: 0 },
    }

    // Send the broadcast
    const deliveryStatus = await sendBroadcastMessage(broadcast, recipients)
    broadcast.deliveryStatus = deliveryStatus

    // Store in history
    broadcastHistory.push(broadcast)

    return NextResponse.json({
      success: true,
      broadcast,
      recipients: recipients.map((r) => ({ id: r.id, name: r.name, groups: r.groups })),
      deliveryStatus,
    })
  } catch (error) {
    console.error("Error sending broadcast:", error)
    return NextResponse.json({ error: "Failed to send broadcast message" }, { status: 500 })
  }
}
