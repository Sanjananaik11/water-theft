import { type NextRequest, NextResponse } from "next/server"

// Mock alert storage (same as in main alerts route)
const alertsStorage: any[] = []

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alertId = params.id
    const alert = alertsStorage.find((a) => a.id === alertId)

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      alert,
    })
  } catch (error) {
    console.error("Error retrieving alert:", error)
    return NextResponse.json({ error: "Failed to retrieve alert" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alertId = params.id
    const body = await request.json()

    const alertIndex = alertsStorage.findIndex((a) => a.id === alertId)

    if (alertIndex === -1) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    const alert = alertsStorage[alertIndex]

    // Handle status updates
    if (body.status) {
      alert.status = body.status

      if (body.status === "acknowledged") {
        alert.acknowledgedBy = body.acknowledgedBy || "system"
        alert.acknowledgedAt = new Date().toISOString()
      }

      if (body.status === "resolved") {
        alert.resolvedAt = new Date().toISOString()
        if (!alert.acknowledgedAt) {
          alert.acknowledgedBy = body.acknowledgedBy || "system"
          alert.acknowledgedAt = new Date().toISOString()
        }
      }
    }

    alertsStorage[alertIndex] = alert

    return NextResponse.json({
      success: true,
      alert,
    })
  } catch (error) {
    console.error("Error updating alert:", error)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }
}
