import { type NextRequest, NextResponse } from "next/server"

// Real-time data processing endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stream = searchParams.get("stream") === "true"

  if (stream) {
    // Server-Sent Events for real-time streaming
    const encoder = new TextEncoder()

    const customReadable = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({
          type: "connection",
          message: "Connected to real-time water monitoring",
          timestamp: new Date().toISOString(),
        })}\n\n`
        controller.enqueue(encoder.encode(data))

        // Simulate real-time data processing
        const interval = setInterval(async () => {
          try {
            // Generate mock sensor data
            const households = ["H001", "H002", "H003", "H004", "H005"]
            const sensorData = households.map((id) => ({
              householdId: id,
              flowRate: 40 + (Math.random() - 0.5) * 30,
              pressure: 2.5 + (Math.random() - 0.5) * 0.8,
              timestamp: new Date().toISOString(),
            }))

            // Process through anomaly detection
            const anomalyResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/anomaly-detection`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ readings: sensorData, anomaliesOnly: true }),
              },
            )

            if (anomalyResponse.ok) {
              const anomalyResult = await anomalyResponse.json()

              // Send real-time update
              const updateData = `data: ${JSON.stringify({
                type: "sensor_update",
                sensorData,
                anomalies: anomalyResult.results,
                timestamp: new Date().toISOString(),
              })}\n\n`
              controller.enqueue(encoder.encode(updateData))

              // Create alerts for detected anomalies
              for (const anomaly of anomalyResult.results) {
                if (anomaly.anomalyType !== "none") {
                  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/alerts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      householdId: anomaly.householdId,
                      anomalyType: anomaly.anomalyType,
                      severity: anomaly.severity,
                      message: anomaly.message,
                    }),
                  })

                  // Send alert notification
                  const alertData = `data: ${JSON.stringify({
                    type: "alert",
                    alert: anomaly,
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                  controller.enqueue(encoder.encode(alertData))
                }
              }
            }
          } catch (error) {
            console.error("Real-time processing error:", error)
            const errorData = `data: ${JSON.stringify({
              type: "error",
              message: "Processing error occurred",
              timestamp: new Date().toISOString(),
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
          }
        }, 5000) // Update every 5 seconds

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  }

  // Regular API response
  return NextResponse.json({
    message: "Real-time processing endpoint",
    endpoints: {
      "GET /api/realtime?stream=true": "Server-Sent Events stream for real-time updates",
      "POST /api/realtime/process": "Process batch sensor data",
      "GET /api/realtime/status": "Get processing system status",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.sensorData || !Array.isArray(body.sensorData)) {
      return NextResponse.json({ error: "Invalid input: sensorData array required" }, { status: 400 })
    }

    // Process sensor data through anomaly detection
    const anomalyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/anomaly-detection`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: body.sensorData }),
      },
    )

    if (!anomalyResponse.ok) {
      throw new Error("Anomaly detection failed")
    }

    const anomalyResult = await anomalyResponse.json()
    const alerts = []

    // Create alerts for detected anomalies
    for (const anomaly of anomalyResult.results) {
      if (anomaly.anomalyType !== "none") {
        const alertResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            householdId: anomaly.householdId,
            anomalyType: anomaly.anomalyType,
            severity: anomaly.severity,
            message: anomaly.message,
          }),
        })

        if (alertResponse.ok) {
          const alertResult = await alertResponse.json()
          alerts.push(alertResult.alert)
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: body.sensorData.length,
      anomaliesDetected: anomalyResult.anomaliesDetected,
      alertsCreated: alerts.length,
      results: {
        anomalies: anomalyResult.results,
        alerts,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Real-time processing error:", error)
    return NextResponse.json({ error: "Real-time processing failed" }, { status: 500 })
  }
}
