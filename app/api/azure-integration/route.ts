import { type NextRequest, NextResponse } from "next/server"
import { azureIoTHub } from "@/lib/azure/iot-hub"
import { azureAnomalyDetector } from "@/lib/azure/anomaly-detector"
import { communicationService } from "@/lib/azure/communication-services"
import { azureSqlDatabase } from "@/lib/azure/sql-database"

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "process_sensor_data":
        return await processSensorData(data)

      case "send_alert":
        return await sendAlert(data)

      case "get_device_status":
        return await getDeviceStatus(data)

      case "test_connections":
        return await testConnections()

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Azure Integration] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processSensorData(data: any) {
  try {
    // Store sensor data in Azure SQL
    await azureSqlDatabase.insertWaterReading({
      householdId: data.householdId,
      flowRate: data.flowRate,
      pressure: data.pressure,
      timestamp: new Date(data.timestamp),
    })

    // Analyze for anomalies using Azure Anomaly Detector
    const anomalyResult = await azureAnomalyDetector.detectAnomalies([
      {
        timestamp: new Date(data.timestamp),
        value: data.flowRate,
      },
    ])

    // If anomaly detected, send alerts
    if (anomalyResult.isAnomaly) {
      const recipients = await azureSqlDatabase.getAlertRecipients()

      await communicationService.sendAlert(
        {
          type: anomalyResult.anomalyType as any,
          householdId: data.householdId,
          message: `Anomaly detected: ${anomalyResult.anomalyType}`,
          severity: anomalyResult.severity as any,
          timestamp: data.timestamp,
          flowRate: data.flowRate,
          pressure: data.pressure,
        },
        recipients,
      )
    }

    return NextResponse.json({
      success: true,
      anomaly: anomalyResult,
      stored: true,
    })
  } catch (error) {
    console.error("[Azure] Process sensor data error:", error)
    return NextResponse.json({ error: "Failed to process sensor data" }, { status: 500 })
  }
}

async function sendAlert(data: any) {
  try {
    const recipients = await azureSqlDatabase.getAlertRecipients()

    await communicationService.sendAlert(data.notification, recipients)

    return NextResponse.json({
      success: true,
      message: "Alert sent successfully",
    })
  } catch (error) {
    console.error("[Azure] Send alert error:", error)
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 })
  }
}

async function getDeviceStatus(data: any) {
  try {
    const deviceStatus = await azureIoTHub.getDeviceStatus(data.deviceId)

    return NextResponse.json({
      success: true,
      status: deviceStatus,
    })
  } catch (error) {
    console.error("[Azure] Get device status error:", error)
    return NextResponse.json({ error: "Failed to get device status" }, { status: 500 })
  }
}

async function testConnections() {
  try {
    const results = {
      iotHub: false,
      sqlDatabase: false,
      anomalyDetector: false,
      communication: { email: false, sms: false },
    }

    // Test IoT Hub connection
    try {
      await azureIoTHub.testConnection()
      results.iotHub = true
    } catch (error) {
      console.error("[Azure] IoT Hub test failed:", error)
    }

    // Test SQL Database connection
    try {
      await azureSqlDatabase.testConnection()
      results.sqlDatabase = true
    } catch (error) {
      console.error("[Azure] SQL Database test failed:", error)
    }

    // Test Anomaly Detector connection
    try {
      await azureAnomalyDetector.testConnection()
      results.anomalyDetector = true
    } catch (error) {
      console.error("[Azure] Anomaly Detector test failed:", error)
    }

    // Test Communication Services
    try {
      results.communication = await communicationService.testConnections()
    } catch (error) {
      console.error("[Azure] Communication Services test failed:", error)
    }

    return NextResponse.json({
      success: true,
      connections: results,
    })
  } catch (error) {
    console.error("[Azure] Test connections error:", error)
    return NextResponse.json({ error: "Failed to test connections" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Azure Integration API",
    endpoints: ["POST /api/azure-integration - Process sensor data, send alerts, get device status, test connections"],
  })
}
