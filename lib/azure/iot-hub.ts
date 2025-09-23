import { IoTHubServiceClient, type Device } from "@azure/iot-hub"
import { azureConfig } from "./config"

export class AzureIoTHubService {
  private serviceClient: IoTHubServiceClient

  constructor() {
    this.serviceClient = IoTHubServiceClient.fromConnectionString(azureConfig.iotHubConnectionString)
  }

  // Register a new water sensor device
  async registerDevice(deviceId: string, householdId: string): Promise<Device> {
    try {
      const device: Device = {
        deviceId,
        status: "enabled",
        authentication: {
          symmetricKey: {
            primaryKey: "",
            secondaryKey: "",
          },
        },
        properties: {
          desired: {
            householdId,
            sensorType: "water_flow",
            reportingInterval: 30000, // 30 seconds
          },
        },
      }

      const result = await this.serviceClient.createOrUpdateDevice(deviceId, device)
      console.log(`[Azure IoT] Device ${deviceId} registered successfully`)
      return result
    } catch (error) {
      console.error(`[Azure IoT] Failed to register device ${deviceId}:`, error)
      throw error
    }
  }

  // Send command to water sensor device
  async sendCommandToDevice(deviceId: string, command: string, payload: any = {}) {
    try {
      const methodRequest = {
        methodName: command,
        payload,
        responseTimeoutInSeconds: 30,
        connectTimeoutInSeconds: 15,
      }

      const result = await this.serviceClient.invokeDeviceMethod(deviceId, methodRequest)
      console.log(`[Azure IoT] Command ${command} sent to device ${deviceId}`)
      return result
    } catch (error) {
      console.error(`[Azure IoT] Failed to send command to device ${deviceId}:`, error)
      throw error
    }
  }

  // Get device twin (device properties and metadata)
  async getDeviceTwin(deviceId: string) {
    try {
      const twin = await this.serviceClient.getTwin(deviceId)
      return twin
    } catch (error) {
      console.error(`[Azure IoT] Failed to get device twin for ${deviceId}:`, error)
      throw error
    }
  }

  // Update device properties
  async updateDeviceProperties(deviceId: string, properties: any) {
    try {
      const twin = await this.serviceClient.getTwin(deviceId)
      const patch = {
        properties: {
          desired: properties,
        },
      }

      const result = await this.serviceClient.updateTwin(deviceId, patch, twin.etag!)
      console.log(`[Azure IoT] Device ${deviceId} properties updated`)
      return result
    } catch (error) {
      console.error(`[Azure IoT] Failed to update device properties for ${deviceId}:`, error)
      throw error
    }
  }

  // List all registered devices
  async listDevices() {
    try {
      const devices = await this.serviceClient.createQuery("SELECT * FROM devices").next()
      return devices.result
    } catch (error) {
      console.error("[Azure IoT] Failed to list devices:", error)
      throw error
    }
  }
}

// Singleton instance
export const azureIoTHub = new AzureIoTHubService()
