import { type NextRequest, NextResponse } from "next/server"

// Mock water sensor data generator
const generateSensorData = (householdId: string, count = 1) => {
  const baseData: Record<string, { flow: number; pressure: number }> = {
    H001: { flow: 45, pressure: 2.5 },
    H002: { flow: 38, pressure: 2.4 },
    H003: { flow: 52, pressure: 2.6 },
    H004: { flow: 41, pressure: 2.3 },
    H005: { flow: 47, pressure: 2.5 },
  }

  const base = baseData[householdId] || { flow: 45, pressure: 2.5 }
  const readings = []

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - (count - 1 - i) * 60000) // 1 minute intervals

    // Add some realistic variation
    const flowVariation = (Math.random() - 0.5) * 20
    const pressureVariation = (Math.random() - 0.5) * 0.8

    // Occasionally simulate anomalies
    let flowRate = base.flow + flowVariation
    let pressure = base.pressure + pressureVariation

    if (Math.random() < 0.1) {
      // 10% chance of anomaly
      const anomalyType = Math.random()
      if (anomalyType < 0.4) {
        // Theft simulation - high flow
        flowRate = base.flow * (1.5 + Math.random() * 0.8)
      } else if (anomalyType < 0.7) {
        // Leak simulation - continuous moderate flow
        const hour = timestamp.getHours()
        if (hour >= 23 || hour <= 5) {
          flowRate = 8 + Math.random() * 12
        }
      } else {
        // Blockage simulation - zero/low flow
        flowRate = Math.random() * 2
        pressure = base.pressure * (0.5 + Math.random() * 0.3)
      }
    }

    readings.push({
      householdId,
      flowRate: Math.max(0, flowRate),
      pressure: Math.max(0, pressure),
      timestamp: timestamp.toISOString(),
    })
  }

  return readings
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get("householdId")
    const count = Number.parseInt(searchParams.get("count") || "1")
    const allHouseholds = searchParams.get("all") === "true"

    if (allHouseholds) {
      // Generate data for all households
      const households = ["H001", "H002", "H003", "H004", "H005"]
      const allData = households.flatMap((id) => generateSensorData(id, count))

      return NextResponse.json({
        success: true,
        totalReadings: allData.length,
        households: households.length,
        data: allData,
        timestamp: new Date().toISOString(),
      })
    }

    if (!householdId) {
      return NextResponse.json({ error: "householdId parameter required" }, { status: 400 })
    }

    const data = generateSensorData(householdId, count)

    return NextResponse.json({
      success: true,
      householdId,
      readings: data.length,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Water data generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simulate storing sensor data (in real system, would save to database)
    console.log("Received sensor data:", body)

    // Validate the incoming data
    if (!body.readings || !Array.isArray(body.readings)) {
      return NextResponse.json({ error: "Invalid data format: readings array required" }, { status: 400 })
    }

    // Process and validate each reading
    const processedReadings = body.readings.map((reading: any) => {
      if (!reading.householdId || typeof reading.flowRate !== "number") {
        throw new Error("Invalid reading format")
      }

      return {
        ...reading,
        timestamp: reading.timestamp || new Date().toISOString(),
        processed: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Sensor data received and processed",
      readingsProcessed: processedReadings.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Water data processing error:", error)
    return NextResponse.json({ error: "Failed to process sensor data" }, { status: 500 })
  }
}
