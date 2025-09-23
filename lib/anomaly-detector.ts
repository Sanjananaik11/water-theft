// Client-side anomaly detection utilities

export interface WaterReading {
  householdId: string
  flowRate: number
  pressure: number
  timestamp: string
}

export interface AnomalyResult {
  householdId: string
  anomalyType: "theft" | "leak" | "blockage" | "none"
  severity: "low" | "medium" | "high"
  confidence: number
  message: string
  timestamp: string
}

// API client for anomaly detection
export class AnomalyDetector {
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  async analyzeReadings(
    readings: WaterReading[],
    anomaliesOnly = false,
  ): Promise<{
    success: boolean
    totalReadings: number
    anomaliesDetected: number
    results: AnomalyResult[]
    timestamp: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/anomaly-detection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readings,
          anomaliesOnly,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Anomaly detection API error:", error)
      throw error
    }
  }

  async getWaterData(
    householdId?: string,
    count = 1,
    allHouseholds = false,
  ): Promise<{
    success: boolean
    data: WaterReading[]
    timestamp: string
  }> {
    try {
      const params = new URLSearchParams()
      if (householdId) params.append("householdId", householdId)
      if (count > 1) params.append("count", count.toString())
      if (allHouseholds) params.append("all", "true")

      const response = await fetch(`${this.baseUrl}/api/water-data?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Water data API error:", error)
      throw error
    }
  }

  // Real-time anomaly detection for streaming data
  async processRealTimeData(reading: WaterReading): Promise<AnomalyResult> {
    const result = await this.analyzeReadings([reading])
    return result.results[0]
  }

  // Batch processing for historical analysis
  async processBatchData(readings: WaterReading[]): Promise<AnomalyResult[]> {
    const batchSize = 100 // Process in batches to avoid timeout
    const results: AnomalyResult[] = []

    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize)
      const batchResult = await this.analyzeReadings(batch)
      results.push(...batchResult.results)
    }

    return results
  }
}

// Utility functions for anomaly analysis
export const getAnomalySeverityColor = (severity: "low" | "medium" | "high"): string => {
  switch (severity) {
    case "high":
      return "text-red-500"
    case "medium":
      return "text-yellow-500"
    case "low":
      return "text-blue-500"
    default:
      return "text-gray-500"
  }
}

export const getAnomalyTypeIcon = (type: string): string => {
  switch (type) {
    case "theft":
      return "⚠️"
    case "leak":
      return "💧"
    case "blockage":
      return "🚫"
    default:
      return "✅"
  }
}

export const formatAnomalyMessage = (anomaly: AnomalyResult): string => {
  return `${anomaly.householdId}: ${anomaly.message} (${anomaly.confidence}% confidence)`
}
