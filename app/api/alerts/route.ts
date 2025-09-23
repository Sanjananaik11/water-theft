import { type NextRequest, NextResponse } from "next/server"

// Types for alert management
interface Alert {
  id: string
  householdId: string
  anomalyType: "theft" | "leak" | "blockage"
  severity: "low" | "medium" | "high"
  message: string
  timestamp: string
  status: "active" | "acknowledged" | "resolved"
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedAt?: string
  notificationsSent: string[] // email, sms, whatsapp
}

interface AlertRule {
  id: string
  name: string
  anomalyType: "theft" | "leak" | "blockage"
  enabled: boolean
  thresholds: {
    flowMultiplier?: number
    nightFlowThreshold?: number
    zeroFlowThreshold?: number
    minDuration?: number
  }
  notifications: {
    email: boolean
    sms: boolean
    whatsapp: boolean
    recipients: string[]
  }
  escalation: {
    enabled: boolean
    timeMinutes: number
    escalateToSupervisor: boolean
  }
}

// Mock alert storage (in real system, would use database)
const alertsStorage: Alert[] = [
  {
    id: "ALT001",
    householdId: "H003",
    anomalyType: "theft",
    severity: "high",
    message: "Unusual spike in water usage detected: 78.5 L/min (151% of normal)",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: "active",
    notificationsSent: ["email", "sms"],
  },
  {
    id: "ALT002",
    householdId: "H001",
    anomalyType: "leak",
    severity: "medium",
    message: "Continuous water flow detected overnight: 8.2 L/min",
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    status: "acknowledged",
    acknowledgedBy: "admin@panchayat.gov",
    acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
    notificationsSent: ["email"],
  },
  {
    id: "ALT003",
    householdId: "H005",
    anomalyType: "blockage",
    severity: "high",
    message: "Zero flow detected for 2 hours: 0.1 L/min",
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    status: "resolved",
    acknowledgedBy: "field@panchayat.gov",
    acknowledgedAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
    notificationsSent: ["email", "sms", "whatsapp"],
  },
]

const alertRulesStorage: AlertRule[] = [
  {
    id: "RULE001",
    name: "Water Theft Detection",
    anomalyType: "theft",
    enabled: true,
    thresholds: {
      flowMultiplier: 1.5,
      minDuration: 300000, // 5 minutes
    },
    notifications: {
      email: true,
      sms: true,
      whatsapp: false,
      recipients: ["admin@panchayat.gov", "supervisor@panchayat.gov"],
    },
    escalation: {
      enabled: true,
      timeMinutes: 30,
      escalateToSupervisor: true,
    },
  },
  {
    id: "RULE002",
    name: "Leak Detection",
    anomalyType: "leak",
    enabled: true,
    thresholds: {
      nightFlowThreshold: 5,
      minDuration: 1800000, // 30 minutes
    },
    notifications: {
      email: true,
      sms: false,
      whatsapp: true,
      recipients: ["maintenance@panchayat.gov"],
    },
    escalation: {
      enabled: false,
      timeMinutes: 60,
      escalateToSupervisor: false,
    },
  },
  {
    id: "RULE003",
    name: "Valve Blockage Detection",
    anomalyType: "blockage",
    enabled: true,
    thresholds: {
      zeroFlowThreshold: 0.5,
      minDuration: 7200000, // 2 hours
    },
    notifications: {
      email: true,
      sms: true,
      whatsapp: true,
      recipients: ["field@panchayat.gov", "emergency@panchayat.gov"],
    },
    escalation: {
      enabled: true,
      timeMinutes: 15,
      escalateToSupervisor: true,
    },
  },
]

// Generate unique alert ID
const generateAlertId = (): string => {
  return "ALT" + Date.now().toString().slice(-6)
}

// Create new alert
const createAlert = (anomalyData: {
  householdId: string
  anomalyType: "theft" | "leak" | "blockage"
  severity: "low" | "medium" | "high"
  message: string
}): Alert => {
  const alert: Alert = {
    id: generateAlertId(),
    ...anomalyData,
    timestamp: new Date().toISOString(),
    status: "active",
    notificationsSent: [],
  }

  alertsStorage.push(alert)
  return alert
}

// Send notifications (mock implementation)
const sendNotifications = async (alert: Alert, rule: AlertRule): Promise<string[]> => {
  const sentNotifications: string[] = []

  try {
    if (rule.notifications.email) {
      // Mock email sending
      console.log(`Sending email alert for ${alert.id} to:`, rule.notifications.recipients)
      sentNotifications.push("email")
    }

    if (rule.notifications.sms) {
      // Mock SMS sending
      console.log(`Sending SMS alert for ${alert.id} to:`, rule.notifications.recipients)
      sentNotifications.push("sms")
    }

    if (rule.notifications.whatsapp) {
      // Mock WhatsApp sending
      console.log(`Sending WhatsApp alert for ${alert.id} to:`, rule.notifications.recipients)
      sentNotifications.push("whatsapp")
    }

    return sentNotifications
  } catch (error) {
    console.error("Error sending notifications:", error)
    return sentNotifications
  }
}

// GET - Retrieve alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const householdId = searchParams.get("householdId")
    const severity = searchParams.get("severity")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredAlerts = [...alertsStorage]

    // Apply filters
    if (status) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === status)
    }

    if (householdId) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.householdId === householdId)
    }

    if (severity) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severity)
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply limit
    filteredAlerts = filteredAlerts.slice(0, limit)

    return NextResponse.json({
      success: true,
      alerts: filteredAlerts,
      total: filteredAlerts.length,
      filters: { status, householdId, severity, limit },
    })
  } catch (error) {
    console.error("Error retrieving alerts:", error)
    return NextResponse.json({ error: "Failed to retrieve alerts" }, { status: 500 })
  }
}

// POST - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.householdId || !body.anomalyType || !body.severity || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: householdId, anomalyType, severity, message" },
        { status: 400 },
      )
    }

    // Create the alert
    const alert = createAlert(body)

    // Find matching alert rule
    const rule = alertRulesStorage.find((r) => r.anomalyType === body.anomalyType && r.enabled)

    if (rule) {
      // Send notifications
      const sentNotifications = await sendNotifications(alert, rule)
      alert.notificationsSent = sentNotifications

      // Update alert in storage
      const alertIndex = alertsStorage.findIndex((a) => a.id === alert.id)
      if (alertIndex !== -1) {
        alertsStorage[alertIndex] = alert
      }
    }

    return NextResponse.json({
      success: true,
      alert,
      notificationsSent: alert.notificationsSent,
    })
  } catch (error) {
    console.error("Error creating alert:", error)
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}
