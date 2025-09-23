// Client-side broadcast management utilities

export interface BroadcastMessage {
  id: string
  title: string
  message: string
  priority: "low" | "medium" | "high" | "emergency"
  channels: ("email" | "sms" | "whatsapp")[]
  targetGroups: ("all" | "officials" | "residents" | "maintenance" | "emergency")[]
  sentBy: string
  timestamp: string
  recipientCount: number
  deliveryStatus: {
    sent: number
    delivered: number
    failed: number
  }
}

export interface Recipient {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  groups: string[]
  active: boolean
  createdAt: string
  lastNotified?: string
}

export class BroadcastManager {
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  // Broadcast management methods
  async getBroadcasts(limit?: number): Promise<{ success: boolean; broadcasts: BroadcastMessage[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${this.baseUrl}/api/broadcast?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching broadcasts:", error)
      throw error
    }
  }

  async sendBroadcast(broadcastData: {
    title: string
    message: string
    priority?: "low" | "medium" | "high" | "emergency"
    channels: ("email" | "sms" | "whatsapp")[]
    targetGroups: ("all" | "officials" | "residents" | "maintenance" | "emergency")[]
    sentBy?: string
  }): Promise<{ success: boolean; broadcast: BroadcastMessage; deliveryStatus: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error sending broadcast:", error)
      throw error
    }
  }

  // Recipient management methods
  async getRecipients(filters?: {
    group?: string
    active?: boolean
    limit?: number
  }): Promise<{ success: boolean; recipients: Recipient[]; total: number; groupStats: any }> {
    try {
      const params = new URLSearchParams()
      if (filters?.group) params.append("group", filters.group)
      if (filters?.active !== undefined) params.append("active", filters.active.toString())
      if (filters?.limit) params.append("limit", filters.limit.toString())

      const response = await fetch(`${this.baseUrl}/api/recipients?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching recipients:", error)
      throw error
    }
  }

  async addRecipient(recipientData: {
    name: string
    email?: string
    phone?: string
    whatsapp?: string
    groups: string[]
    active?: boolean
  }): Promise<{ success: boolean; recipient: Recipient }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipientData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error adding recipient:", error)
      throw error
    }
  }

  // Utility methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case "emergency":
        return "text-red-600 bg-red-50"
      case "high":
        return "text-orange-600 bg-orange-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  formatTimestamp(timestamp: string): string {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffMs = now.getTime() - messageTime.getTime()

    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  // Quick broadcast templates
  getEmergencyTemplate(
    type: "theft" | "leak" | "blockage",
    location: string,
  ): { title: string; message: string; priority: "emergency" } {
    const templates = {
      theft: {
        title: `URGENT: Water Theft Detected - ${location}`,
        message: `Critical water theft detected in ${location}. Immediate investigation required. Unusual consumption patterns indicate unauthorized usage. Please respond immediately.`,
        priority: "emergency" as const,
      },
      leak: {
        title: `URGENT: Major Water Leak - ${location}`,
        message: `Major water leak detected in ${location}. Immediate repair required to prevent water loss and potential damage. Emergency response team dispatched.`,
        priority: "emergency" as const,
      },
      blockage: {
        title: `URGENT: Water Supply Blockage - ${location}`,
        message: `Complete water supply blockage detected in ${location}. Residents may be without water. Emergency maintenance team required immediately.`,
        priority: "emergency" as const,
      },
    }
    return templates[type]
  }

  getMaintenanceTemplate(message: string): { title: string; message: string; priority: "medium" } {
    return {
      title: "Scheduled Water Maintenance",
      message: `Scheduled maintenance notification: ${message}. We apologize for any inconvenience.`,
      priority: "medium" as const,
    }
  }
}

// Export singleton instance
export const broadcastManager = new BroadcastManager()
