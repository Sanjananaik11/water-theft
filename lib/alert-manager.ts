// Client-side alert management utilities

export interface Alert {
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
  notificationsSent: string[]
}

export interface AlertRule {
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

export class AlertManager {
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  // Alert management methods
  async getAlerts(filters?: {
    status?: string
    householdId?: string
    severity?: string
    limit?: number
  }): Promise<{ success: boolean; alerts: Alert[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.householdId) params.append("householdId", filters.householdId)
      if (filters?.severity) params.append("severity", filters.severity)
      if (filters?.limit) params.append("limit", filters.limit.toString())

      const response = await fetch(`${this.baseUrl}/api/alerts?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching alerts:", error)
      throw error
    }
  }

  async createAlert(alertData: {
    householdId: string
    anomalyType: "theft" | "leak" | "blockage"
    severity: "low" | "medium" | "high"
    message: string
  }): Promise<{ success: boolean; alert: Alert; notificationsSent: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alertData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating alert:", error)
      throw error
    }
  }

  async updateAlertStatus(
    alertId: string,
    status: "acknowledged" | "resolved",
    acknowledgedBy?: string,
  ): Promise<{ success: boolean; alert: Alert }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, acknowledgedBy }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating alert:", error)
      throw error
    }
  }

  // Alert rules management
  async getAlertRules(): Promise<{ success: boolean; rules: AlertRule[]; total: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alert-rules`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching alert rules:", error)
      throw error
    }
  }

  async createAlertRule(ruleData: Partial<AlertRule>): Promise<{ success: boolean; rule: AlertRule }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alert-rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating alert rule:", error)
      throw error
    }
  }

  // Utility methods
  getAlertPriorityScore(alert: Alert): number {
    const severityScores = { high: 3, medium: 2, low: 1 }
    const typeScores = { theft: 3, blockage: 2, leak: 1 }

    return severityScores[alert.severity] * typeScores[alert.anomalyType]
  }

  formatAlertAge(timestamp: string): string {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()

    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  getStatusColor(status: Alert["status"]): string {
    switch (status) {
      case "active":
        return "text-red-500"
      case "acknowledged":
        return "text-yellow-500"
      case "resolved":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  getSeverityColor(severity: Alert["severity"]): string {
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
}

// Export singleton instance
export const alertManager = new AlertManager()
