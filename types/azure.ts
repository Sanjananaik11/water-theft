// TypeScript type definitions for Azure integration

export interface AzureConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  iotHubConnectionString: string
  iotHubName: string
  sqlConnectionString: string
  storageConnectionString: string
  storageAccountName: string
  anomalyDetectorEndpoint: string
  anomalyDetectorKey: string
  communicationConnectionString: string
  logicAppUrl: string
}

export interface IoTDevice {
  deviceId: string
  householdId: string
  status: "enabled" | "disabled"
  lastActivity?: Date
  properties?: {
    sensorType: string
    reportingInterval: number
    calibrationDate?: Date
  }
}

export interface SensorReading {
  deviceId: string
  householdId: string
  flowRate: number
  pressure: number
  temperature?: number
  timestamp: Date
  batteryLevel?: number
  signalStrength?: number
}

export interface AnomalyDetectionResult {
  householdId: string
  anomalyType: "theft" | "leak" | "blockage" | "none"
  confidence: number
  message: string
  timestamp: Date
  severity: "low" | "medium" | "high" | "critical"
  expectedValue: number
  actualValue: number
  threshold: number
}

export interface AlertRule {
  id: number
  ruleName: string
  alertType: string
  condition: string
  threshold: number
  severity: "low" | "medium" | "high" | "critical"
  isActive: boolean
}

export interface NotificationChannel {
  type: "email" | "sms" | "whatsapp"
  enabled: boolean
  recipients: string[]
}

export interface WaterUsagePattern {
  householdId: string
  dailyAverage: number
  weeklyAverage: number
  monthlyAverage: number
  peakHours: number[]
  lowUsageHours: number[]
  seasonalVariation: number
  lastUpdated: Date
}

export interface SystemHealth {
  totalDevices: number
  activeDevices: number
  offlineDevices: number
  lastDataReceived: Date
  systemUptime: number
  alertsGenerated24h: number
  anomaliesDetected24h: number
}
