// Azure Services Integration
// Main entry point for all Azure services

import { validateAzureConfig } from "./config"
import { azureSQL } from "./sql-database"
import { azureBlob } from "./blob-storage"

// Types
export type { WaterReading, Alert } from "./sql-database"
export type { TimeSeriesPoint, AnomalyResult } from "./anomaly-detector"
export type { NotificationRecipient, AlertNotification } from "./communication-services"

// Initialize all Azure services
export const initializeAzureServices = async () => {
  try {
    console.log("[Azure] Initializing Azure services...")

    // Validate configuration
    validateAzureConfig()

    // Initialize blob storage container
    await azureBlob.initializeContainer()

    // Connect to SQL database
    await azureSQL.connect()

    console.log("[Azure] All Azure services initialized successfully")
    return true
  } catch (error) {
    console.error("[Azure] Failed to initialize Azure services:", error)
    throw error
  }
}

// Cleanup Azure services
export const cleanupAzureServices = async () => {
  try {
    console.log("[Azure] Cleaning up Azure services...")

    // Disconnect from SQL database
    await azureSQL.disconnect()

    console.log("[Azure] Azure services cleanup completed")
  } catch (error) {
    console.error("[Azure] Failed to cleanup Azure services:", error)
  }
}
