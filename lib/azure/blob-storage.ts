import { BlobServiceClient } from "@azure/storage-blob"
import { azureConfig } from "./config"

export class AzureBlobService {
  private blobServiceClient: BlobServiceClient
  private containerName = "water-sensor-data"

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(azureConfig.storageConnectionString)
  }

  // Initialize container
  async initializeContainer(): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      await containerClient.createIfNotExists({
        access: "private",
      })
      console.log(`[Azure Blob] Container ${this.containerName} initialized`)
    } catch (error) {
      console.error("[Azure Blob] Failed to initialize container:", error)
      throw error
    }
  }

  // Upload sensor data as JSON
  async uploadSensorData(householdId: string, data: any, timestamp: Date = new Date()): Promise<string> {
    try {
      await this.initializeContainer()

      const blobName = `${householdId}/${timestamp.getFullYear()}/${timestamp.getMonth() + 1}/${timestamp.getDate()}/${timestamp.getTime()}.json`
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      const jsonData = JSON.stringify(data, null, 2)
      await blockBlobClient.upload(jsonData, jsonData.length, {
        blobHTTPHeaders: {
          blobContentType: "application/json",
        },
        metadata: {
          householdId,
          timestamp: timestamp.toISOString(),
          dataType: "sensor_reading",
        },
      })

      console.log(`[Azure Blob] Uploaded sensor data: ${blobName}`)
      return blobName
    } catch (error) {
      console.error("[Azure Blob] Failed to upload sensor data:", error)
      throw error
    }
  }

  // Upload daily aggregated data
  async uploadDailyAggregate(householdId: string, date: Date, aggregateData: any): Promise<string> {
    try {
      await this.initializeContainer()

      const blobName = `aggregates/${householdId}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}.json`
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      const jsonData = JSON.stringify(aggregateData, null, 2)
      await blockBlobClient.upload(jsonData, jsonData.length, {
        blobHTTPHeaders: {
          blobContentType: "application/json",
        },
        metadata: {
          householdId,
          date: date.toISOString(),
          dataType: "daily_aggregate",
        },
      })

      console.log(`[Azure Blob] Uploaded daily aggregate: ${blobName}`)
      return blobName
    } catch (error) {
      console.error("[Azure Blob] Failed to upload daily aggregate:", error)
      throw error
    }
  }

  // Download sensor data
  async downloadSensorData(blobName: string): Promise<any> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      const downloadResponse = await blockBlobClient.download()
      const downloadedContent = await this.streamToString(downloadResponse.readableStreamBody!)

      return JSON.parse(downloadedContent)
    } catch (error) {
      console.error("[Azure Blob] Failed to download sensor data:", error)
      throw error
    }
  }

  // List blobs for a household
  async listHouseholdData(householdId: string, date?: Date): Promise<string[]> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const prefix = date
        ? `${householdId}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}/`
        : `${householdId}/`

      const blobs: string[] = []
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        blobs.push(blob.name)
      }

      return blobs
    } catch (error) {
      console.error("[Azure Blob] Failed to list household data:", error)
      throw error
    }
  }

  // Helper function to convert stream to string
  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data))
      })
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks).toString())
      })
      readableStream.on("error", reject)
    })
  }
}

// Singleton instance
export const azureBlob = new AzureBlobService()
