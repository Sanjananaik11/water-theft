import { AnomalyDetectorClient } from "@azure/cognitiveservices-anomalydetector"
import { AzureKeyCredential } from "@azure/core-auth"
import { azureConfig } from "./config"

export interface TimeSeriesPoint {
  timestamp: Date
  value: number
}

export interface AnomalyResult {
  isAnomaly: boolean
  anomalyScore: number
  expectedValue: number
  upperMargin: number
  lowerMargin: number
  period?: number
}

export class AzureAnomalyDetectorService {
  private client: AnomalyDetectorClient

  constructor() {
    this.client = new AnomalyDetectorClient(
      azureConfig.anomalyDetectorEndpoint,
      new AzureKeyCredential(azureConfig.anomalyDetectorKey),
    )
  }

  // Detect anomalies in entire time series
  async detectEntireSeries(
    data: TimeSeriesPoint[],
    granularity: "yearly" | "monthly" | "weekly" | "daily" | "hourly" | "minutely" = "hourly",
  ): Promise<AnomalyResult[]> {
    try {
      const request = {
        series: data.map((point) => ({
          timestamp: point.timestamp,
          value: point.value,
        })),
        granularity,
        sensitivity: 95, // Sensitivity level (1-99)
      }

      const result = await this.client.detectEntireSeries(request)

      return result.isAnomaly!.map((isAnomaly, index) => ({
        isAnomaly,
        anomalyScore: result.expectedValues![index],
        expectedValue: result.expectedValues![index],
        upperMargin: result.upperMargins![index],
        lowerMargin: result.lowerMargins![index],
        period: result.period,
      }))
    } catch (error) {
      console.error("[Azure Anomaly Detector] Failed to detect entire series:", error)
      throw error
    }
  }

  // Detect anomaly in latest point
  async detectLatestPoint(
    data: TimeSeriesPoint[],
    granularity: "yearly" | "monthly" | "weekly" | "daily" | "hourly" | "minutely" = "hourly",
  ): Promise<AnomalyResult> {
    try {
      const request = {
        series: data.map((point) => ({
          timestamp: point.timestamp,
          value: point.value,
        })),
        granularity,
        sensitivity: 95,
      }

      const result = await this.client.detectLastPoint(request)

      return {
        isAnomaly: result.isAnomaly!,
        anomalyScore: result.expectedValue!,
        expectedValue: result.expectedValue!,
        upperMargin: result.upperMargin!,
        lowerMargin: result.lowerMargin!,
        period: result.period,
      }
    } catch (error) {
      console.error("[Azure Anomaly Detector] Failed to detect latest point:", error)
      throw error
    }
  }

  // Detect change points in time series
  async detectChangePoints(
    data: TimeSeriesPoint[],
    granularity: "yearly" | "monthly" | "weekly" | "daily" | "hourly" | "minutely" = "hourly",
  ): Promise<boolean[]> {
    try {
      const request = {
        series: data.map((point) => ({
          timestamp: point.timestamp,
          value: point.value,
        })),
        granularity,
      }

      const result = await this.client.detectChangePoint(request)
      return result.isChangePoint!
    } catch (error) {
      console.error("[Azure Anomaly Detector] Failed to detect change points:", error)
      throw error
    }
  }

  // Analyze water flow patterns for theft detection
  async analyzeWaterFlowPattern(
    householdId: string,
    flowData: TimeSeriesPoint[],
  ): Promise<{
    anomalies: AnomalyResult[]
    changePoints: boolean[]
    theftLikelihood: number
    leakLikelihood: number
    blockageLikelihood: number
  }> {
    try {
      // Detect anomalies
      const anomalies = await this.detectEntireSeries(flowData, "hourly")

      // Detect change points
      const changePoints = await this.detectChangePoints(flowData, "hourly")

      // Calculate likelihood scores based on patterns
      const anomalyCount = anomalies.filter((a) => a.isAnomaly).length
      const changePointCount = changePoints.filter((cp) => cp).length
      const totalPoints = flowData.length

      // Calculate average flow and variance
      const avgFlow = flowData.reduce((sum, point) => sum + point.value, 0) / totalPoints
      const variance = flowData.reduce((sum, point) => sum + Math.pow(point.value - avgFlow, 2), 0) / totalPoints

      // Theft likelihood: sudden spikes in usage
      const highAnomalies = anomalies.filter((a) => a.isAnomaly && a.anomalyScore > a.expectedValue * 1.5).length
      const theftLikelihood = Math.min((highAnomalies / totalPoints) * 100, 100)

      // Leak likelihood: continuous high flow
      const continuousHighFlow = flowData.filter((point) => point.value > avgFlow * 1.3).length
      const leakLikelihood = Math.min((continuousHighFlow / totalPoints) * 100, 100)

      // Blockage likelihood: sudden drops or zero flow
      const lowAnomalies = anomalies.filter((a) => a.isAnomaly && a.anomalyScore < a.expectedValue * 0.5).length
      const zeroFlowPoints = flowData.filter((point) => point.value === 0).length
      const blockageLikelihood = Math.min(((lowAnomalies + zeroFlowPoints) / totalPoints) * 100, 100)

      console.log(`[Azure Anomaly Detector] Analysis complete for ${householdId}`)

      return {
        anomalies,
        changePoints,
        theftLikelihood,
        leakLikelihood,
        blockageLikelihood,
      }
    } catch (error) {
      console.error("[Azure Anomaly Detector] Failed to analyze water flow pattern:", error)
      throw error
    }
  }
}

// Singleton instance
export const azureAnomalyDetector = new AzureAnomalyDetectorService()
