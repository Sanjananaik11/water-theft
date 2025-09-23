import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity"

// Azure configuration
export const azureConfig = {
  // Authentication
  tenantId: process.env.AZURE_TENANT_ID!,
  clientId: process.env.AZURE_CLIENT_ID!,
  clientSecret: process.env.AZURE_CLIENT_SECRET!,

  // IoT Hub
  iotHubConnectionString: process.env.AZURE_IOT_HUB_CONNECTION_STRING!,
  iotHubName: process.env.AZURE_IOT_HUB_NAME!,

  // SQL Database
  sqlConnectionString: process.env.AZURE_SQL_CONNECTION_STRING!,

  // Blob Storage
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
  storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,

  // Anomaly Detector
  anomalyDetectorEndpoint: process.env.AZURE_ANOMALY_DETECTOR_ENDPOINT!,
  anomalyDetectorKey: process.env.AZURE_ANOMALY_DETECTOR_KEY!,

  // Communication Services
  communicationConnectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING!,

  // Logic Apps
  logicAppUrl: process.env.AZURE_LOGIC_APP_URL!,
}

// Create Azure credential
export const getAzureCredential = () => {
  if (process.env.NODE_ENV === "production") {
    return new DefaultAzureCredential()
  } else {
    return new ClientSecretCredential(azureConfig.tenantId, azureConfig.clientId, azureConfig.clientSecret)
  }
}

// Validate Azure configuration
export const validateAzureConfig = () => {
  const requiredEnvVars = [
    "AZURE_TENANT_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "AZURE_IOT_HUB_CONNECTION_STRING",
    "AZURE_SQL_CONNECTION_STRING",
    "AZURE_STORAGE_CONNECTION_STRING",
    "AZURE_ANOMALY_DETECTOR_ENDPOINT",
    "AZURE_ANOMALY_DETECTOR_KEY",
    "AZURE_COMMUNICATION_CONNECTION_STRING",
  ]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    throw new Error(`Missing required Azure environment variables: ${missing.join(", ")}`)
  }

  return true
}
