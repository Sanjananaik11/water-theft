import { type NextRequest, NextResponse } from "next/server"

// Alert rules storage (same structure as in alerts route)
const alertRulesStorage: any[] = [
  {
    id: "RULE001",
    name: "Water Theft Detection",
    anomalyType: "theft",
    enabled: true,
    thresholds: {
      flowMultiplier: 1.5,
      minDuration: 300000,
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
      minDuration: 1800000,
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
      minDuration: 7200000,
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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      rules: alertRulesStorage,
      total: alertRulesStorage.length,
    })
  } catch (error) {
    console.error("Error retrieving alert rules:", error)
    return NextResponse.json({ error: "Failed to retrieve alert rules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.anomalyType) {
      return NextResponse.json({ error: "Missing required fields: name, anomalyType" }, { status: 400 })
    }

    const newRule = {
      id: "RULE" + Date.now().toString().slice(-3),
      ...body,
      enabled: body.enabled !== false, // Default to enabled
    }

    alertRulesStorage.push(newRule)

    return NextResponse.json({
      success: true,
      rule: newRule,
    })
  } catch (error) {
    console.error("Error creating alert rule:", error)
    return NextResponse.json({ error: "Failed to create alert rule" }, { status: 500 })
  }
}
