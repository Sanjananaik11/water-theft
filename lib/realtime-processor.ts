// Client-side real-time data processing utilities

export interface SensorReading {
  householdId: string
  flowRate: number
  pressure: number
  timestamp: string
}

export interface RealtimeUpdate {
  type: "connection" | "sensor_update" | "alert" | "error"
  sensorData?: SensorReading[]
  anomalies?: any[]
  alert?: any
  message?: string
  timestamp: string
}

export class RealtimeProcessor {
  private eventSource: EventSource | null = null
  private baseUrl: string
  private listeners: Map<string, ((data: RealtimeUpdate) => void)[]> = new Map()

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  // Start real-time monitoring
  startMonitoring(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(`${this.baseUrl}/api/realtime?stream=true`)

        this.eventSource.onopen = () => {
          console.log("[v0] Real-time monitoring connected")
          resolve()
        }

        this.eventSource.onmessage = (event) => {
          try {
            const data: RealtimeUpdate = JSON.parse(event.data)
            this.notifyListeners(data.type, data)
          } catch (error) {
            console.error("[v0] Error parsing real-time data:", error)
          }
        }

        this.eventSource.onerror = (error) => {
          console.error("[v0] Real-time monitoring error:", error)
          this.notifyListeners("error", {
            type: "error",
            message: "Connection error occurred",
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("[v0] Failed to start monitoring:", error)
        reject(error)
      }
    })
  }

  // Stop real-time monitoring
  stopMonitoring(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      console.log("[v0] Real-time monitoring stopped")
    }
  }

  // Add event listener
  addEventListener(type: string, callback: (data: RealtimeUpdate) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(callback)
  }

  // Remove event listener
  removeEventListener(type: string, callback: (data: RealtimeUpdate) => void): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Notify listeners
  private notifyListeners(type: string, data: RealtimeUpdate): void {
    const listeners = this.listeners.get(type) || []
    listeners.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("[v0] Error in event listener:", error)
      }
    })
  }

  // Process batch data
  async processBatchData(sensorData: SensorReading[]): Promise<{
    success: boolean
    processed: number
    anomaliesDetected: number
    alertsCreated: number
    results: any
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/realtime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sensorData }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Batch processing error:", error)
      throw error
    }
  }

  // Get system status
  async getSystemStatus(): Promise<{
    status: string
    components: Record<string, string>
    metrics: Record<string, any>
    activeConnections: number
    queueStatus: Record<string, number>
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/realtime/status`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Status check error:", error)
      throw error
    }
  }

  // Check if monitoring is active
  isMonitoring(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }

  // Get connection state
  getConnectionState(): string {
    if (!this.eventSource) return "disconnected"

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return "connecting"
      case EventSource.OPEN:
        return "connected"
      case EventSource.CLOSED:
        return "disconnected"
      default:
        return "unknown"
    }
  }
}

// Export singleton instance
export const realtimeProcessor = new RealtimeProcessor()
