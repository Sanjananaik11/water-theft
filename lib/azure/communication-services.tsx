import { EmailClient } from "@azure/communication-email"
import { SmsClient } from "@azure/communication-sms"
import { azureConfig } from "./config"

interface NotificationData {
  type: "theft" | "leak" | "blockage" | "emergency"
  householdId: string
  message: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  location?: string
  flowRate?: number
  pressure?: number
}

interface Recipient {
  name: string
  email?: string
  phone?: string
  role: "official" | "resident" | "technician"
  notifications: ("email" | "sms" | "whatsapp")[]
}

class CommunicationService {
  private emailClient: EmailClient | null = null
  private smsClient: SmsClient | null = null

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    try {
      if (azureConfig.communication.connectionString) {
        this.emailClient = new EmailClient(azureConfig.communication.connectionString)
        this.smsClient = new SmsClient(azureConfig.communication.connectionString)
      }
    } catch (error) {
      console.error("[Azure] Failed to initialize communication clients:", error)
    }
  }

  async sendAlert(notification: NotificationData, recipients: Recipient[]): Promise<void> {
    const promises: Promise<void>[] = []

    for (const recipient of recipients) {
      if (recipient.notifications.includes("email") && recipient.email) {
        promises.push(this.sendEmail(notification, recipient))
      }
      if (recipient.notifications.includes("sms") && recipient.phone) {
        promises.push(this.sendSMS(notification, recipient))
      }
      if (recipient.notifications.includes("whatsapp") && recipient.phone) {
        promises.push(this.sendWhatsApp(notification, recipient))
      }
    }

    await Promise.allSettled(promises)
  }

  private async sendEmail(notification: NotificationData, recipient: Recipient): Promise<void> {
    if (!this.emailClient) {
      throw new Error("Email client not initialized")
    }

    const subject = this.getEmailSubject(notification)
    const htmlContent = this.generateEmailTemplate(notification, recipient)

    try {
      await this.emailClient.beginSend({
        senderAddress: "alerts@kandavara-water.gov.in",
        content: {
          subject,
          html: htmlContent,
          plainText: this.generatePlainTextMessage(notification),
        },
        recipients: {
          to: [{ address: recipient.email!, displayName: recipient.name }],
        },
      })
      console.log(`[Azure] Email sent to ${recipient.email}`)
    } catch (error) {
      console.error(`[Azure] Failed to send email to ${recipient.email}:`, error)
      throw error
    }
  }

  private async sendSMS(notification: NotificationData, recipient: Recipient): Promise<void> {
    if (!this.smsClient) {
      throw new Error("SMS client not initialized")
    }

    const message = this.generateSMSMessage(notification)

    try {
      await this.smsClient.send({
        from: "+1234567890", // Replace with your Azure Communication Services phone number
        to: [recipient.phone!],
        message,
      })
      console.log(`[Azure] SMS sent to ${recipient.phone}`)
    } catch (error) {
      console.error(`[Azure] Failed to send SMS to ${recipient.phone}:`, error)
      throw error
    }
  }

  private async sendWhatsApp(notification: NotificationData, recipient: Recipient): Promise<void> {
    // WhatsApp integration via Azure Logic Apps
    const logicAppUrl = azureConfig.logicApps.whatsappWebhook

    if (!logicAppUrl) {
      console.warn("[Azure] WhatsApp Logic App URL not configured")
      return
    }

    const payload = {
      to: recipient.phone,
      message: this.generateWhatsAppMessage(notification),
      recipient: recipient.name,
      severity: notification.severity,
      type: notification.type,
    }

    try {
      const response = await fetch(logicAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log(`[Azure] WhatsApp message sent to ${recipient.phone}`)
    } catch (error) {
      console.error(`[Azure] Failed to send WhatsApp to ${recipient.phone}:`, error)
      throw error
    }
  }

  private getEmailSubject(notification: NotificationData): string {
    const severityPrefix =
      notification.severity === "critical"
        ? "🚨 URGENT"
        : notification.severity === "high"
          ? "⚠️ HIGH PRIORITY"
          : notification.severity === "medium"
            ? "⚡ ALERT"
            : "ℹ️ NOTICE"

    const typeMap = {
      theft: "Water Theft Detected",
      leak: "Water Leak Detected",
      blockage: "Valve Blockage Detected",
      emergency: "Emergency Alert",
    }

    return `${severityPrefix}: ${typeMap[notification.type]} - ${notification.householdId}`
  }

  private generateEmailTemplate(notification: NotificationData, recipient: Recipient): string {
    const severityColor = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#d97706",
      low: "#65a30d",
    }[notification.severity]

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kandavara Panchayat Water Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${severityColor}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0;">Kandavara Panchayat Water Management</h2>
              <p style="margin: 5px 0 0 0;">Alert Notification System</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: ${severityColor}; margin-top: 0;">
                ${notification.type.toUpperCase()} DETECTED
              </h3>
              <p><strong>Household:</strong> ${notification.householdId}</p>
              ${notification.location ? `<p><strong>Location:</strong> ${notification.location}</p>` : ""}
              <p><strong>Time:</strong> ${new Date(notification.timestamp).toLocaleString()}</p>
              <p><strong>Severity:</strong> ${notification.severity.toUpperCase()}</p>
              ${notification.flowRate ? `<p><strong>Flow Rate:</strong> ${notification.flowRate} L/min</p>` : ""}
              ${notification.pressure ? `<p><strong>Pressure:</strong> ${notification.pressure} bar</p>` : ""}
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px;">
              <h4>Alert Details:</h4>
              <p>${notification.message}</p>
              
              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 5px;">
                <p style="margin: 0;"><strong>Action Required:</strong></p>
                <p style="margin: 5px 0 0 0;">Please investigate this anomaly immediately and take appropriate corrective measures.</p>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 5px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This is an automated alert from Kandavara Panchayat Water Theft Detection System<br>
                For technical support, contact: support@kandavara.gov.in
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generatePlainTextMessage(notification: NotificationData): string {
    return `
KANDAVARA PANCHAYAT WATER ALERT

${notification.type.toUpperCase()} DETECTED
Household: ${notification.householdId}
Time: ${new Date(notification.timestamp).toLocaleString()}
Severity: ${notification.severity.toUpperCase()}

Details: ${notification.message}

Action Required: Please investigate this anomaly immediately.

This is an automated alert from Kandavara Panchayat Water Management System.
    `.trim()
  }

  private generateSMSMessage(notification: NotificationData): string {
    const emoji = {
      theft: "🚨",
      leak: "💧",
      blockage: "🔧",
      emergency: "⚠️",
    }[notification.type]

    return `${emoji} KANDAVARA WATER ALERT
${notification.type.toUpperCase()}: ${notification.householdId}
${notification.message}
Time: ${new Date(notification.timestamp).toLocaleTimeString()}
Severity: ${notification.severity.toUpperCase()}
Investigate immediately.`
  }

  private generateWhatsAppMessage(notification: NotificationData): string {
    const emoji = {
      theft: "🚨",
      leak: "💧",
      blockage: "🔧",
      emergency: "⚠️",
    }[notification.type]

    return `${emoji} *KANDAVARA PANCHAYAT WATER ALERT*

*${notification.type.toUpperCase()} DETECTED*
📍 Household: *${notification.householdId}*
⏰ Time: ${new Date(notification.timestamp).toLocaleString()}
🔥 Severity: *${notification.severity.toUpperCase()}*

📋 *Details:*
${notification.message}

⚡ *Action Required:*
Please investigate this water anomaly immediately and take corrective measures.

_This is an automated alert from Kandavara Panchayat Water Management System_`
  }

  // Broadcast methods for sending to all recipients
  async broadcastEmergencyAlert(message: string, recipients: Recipient[]): Promise<void> {
    const notification: NotificationData = {
      type: "emergency",
      householdId: "ALL",
      message,
      severity: "critical",
      timestamp: new Date().toISOString(),
    }

    await this.sendAlert(notification, recipients)
  }

  async testConnections(): Promise<{ email: boolean; sms: boolean }> {
    const results = {
      email: false,
      sms: false,
    }

    try {
      if (this.emailClient) {
        // Test email connection (this is a simplified test)
        results.email = true
      }
    } catch (error) {
      console.error("[Azure] Email connection test failed:", error)
    }

    try {
      if (this.smsClient) {
        // Test SMS connection (this is a simplified test)
        results.sms = true
      }
    } catch (error) {
      console.error("[Azure] SMS connection test failed:", error)
    }

    return results
  }
}

// Singleton instance
export const communicationService = new CommunicationService()
export type { NotificationData, Recipient }
