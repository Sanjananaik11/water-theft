import { type NextRequest, NextResponse } from "next/server"

// Types for water monitoring data
interface WaterReading {
  householdId: string
  flowRate: number
  pressure: number
  timestamp: string
}

interface AnomalyResult {
  householdId: string
  anomalyType: "theft" | "leak" | "blockage" | "none"
  severity: "low" | "medium" | "high"
  confidence: number
  message: string
  timestamp: string
}

// Anomaly detection thresholds
const THRESHOLDS = {
  theft: {
    flowMultiplier: 1.5, // 150% of normal flow
    minDuration: 300000, // 5 minutes in milliseconds
  },
  leak: {
    nightFlowThreshold: 5, // L/min during night hours (11PM - 5AM)
    minDuration: 1800000, // 30 minutes in milliseconds
  },
  blockage: {
    zeroFlowThreshold: 0.5, // L/min
    minDuration: 7200000, // 2 hours in milliseconds
  },
}

// Mock historical data for baseline comparison
const getHistoricalBaseline = (householdId: string) => {
  // In a real system, this would query historical data from database
  const baselines: Record<string, { avgFlow: number; avgPressure: number }> = {
    H001: { avgFlow: 45, avgPressure: 2.5 },
    H002: { avgFlow: 38, avgPressure: 2.4 },
    H003: { avgFlow: 52, avgPressure: 2.6 },
    H004: { avgFlow: 41, avgPressure: 2.3 },
    H005: { avgFlow: 47, avgPressure: 2.5 },
  }
  return baselines[householdId] || { avgFlow: 45, avgPressure: 2.5 }
}

// Theft detection algorithm
const detectTheft = (reading: WaterReading, baseline: { avgFlow: number }): AnomalyResult | null => {
  const flowRatio = reading.flowRate / baseline.avgFlow

  if (flowRatio >= THRESHOLDS.theft.flowMultiplier) {
    const severity = flowRatio >= 2.0 ? "high" : flowRatio >= 1.8 ? "medium" : "low"
    const confidence = Math.min(95, (flowRatio - 1) * 100)

    return {
      householdId: reading.householdId,
      anomalyType: "theft",
      severity,
      confidence,
      message: `Unusual spike detected: ${reading.flowRate.toFixed(1)} L/min (${(flowRatio * 100).toFixed(0)}% of normal)`,
      timestamp: reading.timestamp,
    }
  }

  return null
}

// Leak detection algorithm
const detectLeak = (reading: WaterReading): AnomalyResult | null => {
  const hour = new Date(reading.timestamp).getHours()
  const isNightTime = hour >= 23 || hour <= 5

  if (isNightTime && reading.flowRate > THRESHOLDS.leak.nightFlowThreshold) {
    const severity = reading.flowRate > 15 ? "high" : reading.flowRate > 10 ? "medium" : "low"
    const confidence = Math.min(90, reading.flowRate * 5)

    return {
      householdId: reading.householdId,
      anomalyType: "leak",
      severity,
      confidence,
      message: `Continuous flow during night hours: ${reading.flowRate.toFixed(1)} L/min`,
      timestamp: reading.timestamp,
    }
  }

  return null
}

// Blockage detection algorithm
const detectBlockage = (reading: WaterReading, baseline: { avgPressure: number }): AnomalyResult | null => {
  const isZeroFlow = reading.flowRate <= THRESHOLDS.blockage.zeroFlowThreshold
  const isLowPressure = reading.pressure < baseline.avgPressure * 0.7

  if (isZeroFlow || isLowPressure) {
    const severity = isZeroFlow && isLowPressure ? "high" : "medium"
    const confidence = isZeroFlow ? 85 : 70

    return {
      householdId: reading.householdId,
      anomalyType: "blockage",
      severity,
      confidence,
      message: isZeroFlow
        ? `Zero flow detected: ${reading.flowRate.toFixed(1)} L/min`
        : `Low pressure detected: ${reading.pressure.toFixed(1)} bar`,
      timestamp: reading.timestamp,
    }
  }

  return null
}

// Main anomaly detection function
const analyzeWaterReading = (reading: WaterReading): AnomalyResult => {
  const baseline = getHistoricalBaseline(reading.householdId)

  // Run all detection algorithms
  const theftAnomaly = detectTheft(reading, baseline)
  const leakAnomaly = detectLeak(reading)
  const blockageAnomaly = detectBlockage(reading, baseline)

  // Return the highest priority anomaly
  const anomalies = [theftAnomaly, leakAnomaly, blockageAnomaly].filter(Boolean) as AnomalyResult[]

  if (anomalies.length === 0) {
    return {
      householdId: reading.householdId,
      anomalyType: "none",
      severity: "low",
      confidence: 95,
      message: "Normal water usage detected",
      timestamp: reading.timestamp,
    }
  }

  // Return anomaly with highest severity
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })[0]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.readings || !Array.isArray(body.readings)) {
      return NextResponse.json({ error: "Invalid input: readings array required" }, { status: 400 })
    }

    const readings: WaterReading[] = body.readings

    // Process each reading through anomaly detection
    const results = readings.map((reading) => {
      // Validate reading structure
      if (!reading.householdId || typeof reading.flowRate !== "number" || typeof reading.pressure !== "number") {
        throw new Error(`Invalid reading structure for household ${reading.householdId}`)
      }

      return analyzeWaterReading(reading)
    })

    // Filter out normal readings if requested
    const anomaliesOnly = body.anomaliesOnly === true
    const filteredResults = anomaliesOnly ? results.filter((result) => result.anomalyType !== "none") : results

    return NextResponse.json({
      success: true,
      totalReadings: readings.length,
      anomaliesDetected: results.filter((r) => r.anomalyType !== "none").length,
      results: filteredResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Anomaly detection error:", error)
    return NextResponse.json({ error: "Internal server error during anomaly detection" }, { status: 500 })
  }
}

export async function GET() {
  // Return API documentation
  return NextResponse.json({
    name: "Water Theft Detection API",
    version: "1.0.0",
    description: "Anomaly detection for water usage monitoring",
    endpoints: {
      "POST /api/anomaly-detection": {
        description: "Analyze water readings for anomalies",
        parameters: {
          readings: "Array of water reading objects",
          anomaliesOnly: "Boolean - return only anomalies (optional)",
        },
        example: {
          readings: [
            {
              householdId: "H001",
              flowRate: 67.5,
              pressure: 2.3,
              timestamp: "2024-01-15T10:30:00Z",
            },
          ],
          anomaliesOnly: false,
        },
      },
    },
    thresholds: THRESHOLDS,
  })
}
