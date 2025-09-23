import { ConnectionPool, type config as SqlConfig, Request } from "mssql"
import { azureConfig } from "./config"

export interface WaterReading {
  id?: number
  householdId: string
  deviceId: string
  flowRate: number
  pressure: number
  temperature?: number
  timestamp: Date
  anomalyScore?: number
  anomalyType?: string
}

export interface Alert {
  id?: number
  householdId: string
  alertType: string
  severity: string
  message: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

export class AzureSQLService {
  private pool: ConnectionPool | null = null
  private config: SqlConfig

  constructor() {
    this.config = {
      connectionString: azureConfig.sqlConnectionString,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    }
  }

  // Initialize database connection
  async connect(): Promise<void> {
    try {
      if (!this.pool) {
        this.pool = new ConnectionPool(this.config)
        await this.pool.connect()
        console.log("[Azure SQL] Connected to database")
      }
    } catch (error) {
      console.error("[Azure SQL] Connection failed:", error)
      throw error
    }
  }

  // Close database connection
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close()
        this.pool = null
        console.log("[Azure SQL] Disconnected from database")
      }
    } catch (error) {
      console.error("[Azure SQL] Disconnect failed:", error)
    }
  }

  // Insert water reading
  async insertWaterReading(reading: WaterReading): Promise<number> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      const result = await request
        .input("householdId", reading.householdId)
        .input("deviceId", reading.deviceId)
        .input("flowRate", reading.flowRate)
        .input("pressure", reading.pressure)
        .input("temperature", reading.temperature)
        .input("timestamp", reading.timestamp)
        .input("anomalyScore", reading.anomalyScore)
        .input("anomalyType", reading.anomalyType)
        .query(`
          INSERT INTO WaterReadings 
          (HouseholdId, DeviceId, FlowRate, Pressure, Temperature, Timestamp, AnomalyScore, AnomalyType)
          OUTPUT INSERTED.Id
          VALUES (@householdId, @deviceId, @flowRate, @pressure, @temperature, @timestamp, @anomalyScore, @anomalyType)
        `)

      return result.recordset[0].Id
    } catch (error) {
      console.error("[Azure SQL] Failed to insert water reading:", error)
      throw error
    }
  }

  // Get recent water readings for a household
  async getRecentReadings(householdId: string, hours = 24): Promise<WaterReading[]> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      const result = await request
        .input("householdId", householdId)
        .input("hours", hours)
        .query(`
          SELECT * FROM WaterReadings 
          WHERE HouseholdId = @householdId 
          AND Timestamp >= DATEADD(hour, -@hours, GETDATE())
          ORDER BY Timestamp DESC
        `)

      return result.recordset.map((record) => ({
        id: record.Id,
        householdId: record.HouseholdId,
        deviceId: record.DeviceId,
        flowRate: record.FlowRate,
        pressure: record.Pressure,
        temperature: record.Temperature,
        timestamp: record.Timestamp,
        anomalyScore: record.AnomalyScore,
        anomalyType: record.AnomalyType,
      }))
    } catch (error) {
      console.error("[Azure SQL] Failed to get recent readings:", error)
      throw error
    }
  }

  // Insert alert
  async insertAlert(alert: Alert): Promise<number> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      const result = await request
        .input("householdId", alert.householdId)
        .input("alertType", alert.alertType)
        .input("severity", alert.severity)
        .input("message", alert.message)
        .input("timestamp", alert.timestamp)
        .input("acknowledged", alert.acknowledged)
        .query(`
          INSERT INTO Alerts 
          (HouseholdId, AlertType, Severity, Message, Timestamp, Acknowledged)
          OUTPUT INSERTED.Id
          VALUES (@householdId, @alertType, @severity, @message, @timestamp, @acknowledged)
        `)

      return result.recordset[0].Id
    } catch (error) {
      console.error("[Azure SQL] Failed to insert alert:", error)
      throw error
    }
  }

  // Get active alerts
  async getActiveAlerts(): Promise<Alert[]> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      const result = await request.query(`
        SELECT * FROM Alerts 
        WHERE Acknowledged = 0 AND ResolvedAt IS NULL
        ORDER BY Timestamp DESC
      `)

      return result.recordset.map((record) => ({
        id: record.Id,
        householdId: record.HouseholdId,
        alertType: record.AlertType,
        severity: record.Severity,
        message: record.Message,
        timestamp: record.Timestamp,
        acknowledged: record.Acknowledged,
        resolvedAt: record.ResolvedAt,
      }))
    } catch (error) {
      console.error("[Azure SQL] Failed to get active alerts:", error)
      throw error
    }
  }

  // Update alert status
  async updateAlertStatus(alertId: number, acknowledged: boolean, resolvedAt?: Date): Promise<void> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      await request
        .input("alertId", alertId)
        .input("acknowledged", acknowledged)
        .input("resolvedAt", resolvedAt)
        .query(`
          UPDATE Alerts 
          SET Acknowledged = @acknowledged, ResolvedAt = @resolvedAt
          WHERE Id = @alertId
        `)
    } catch (error) {
      console.error("[Azure SQL] Failed to update alert status:", error)
      throw error
    }
  }

  async getAlertRecipients(): Promise<any[]> {
    await this.connect()

    try {
      const request = new Request(this.pool!)
      const result = await request.query(`
        SELECT * FROM AlertRecipients 
        WHERE Active = 1
        ORDER BY Role, Name
      `)

      return result.recordset.map((record) => ({
        name: record.Name,
        email: record.Email,
        phone: record.Phone,
        role: record.Role,
        notifications: record.NotificationTypes ? record.NotificationTypes.split(",") : ["email"],
      }))
    } catch (error) {
      console.error("[Azure SQL] Failed to get alert recipients:", error)
      // Return default recipients if table doesn't exist
      return [
        {
          name: "Panchayat Official",
          email: "official@kandavara.gov.in",
          phone: "+91-9876543210",
          role: "official",
          notifications: ["email", "sms", "whatsapp"],
        },
      ]
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      const request = new Request(this.pool!)
      await request.query("SELECT 1 as test")
      return true
    } catch (error) {
      console.error("[Azure SQL] Connection test failed:", error)
      return false
    }
  }
}

// Singleton instance
export const azureSQL = new AzureSQLService()
export const azureSqlDatabase = azureSQL
