"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface ConnectionStatus {
  iotHub: boolean
  sqlDatabase: boolean
  anomalyDetector: boolean
  communication: {
    email: boolean
    sms: boolean
  }
}

export function AzureStatusPanel() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const testConnections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/azure-integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "test_connections" }),
      })

      if (response.ok) {
        const result = await response.json()
        setConnectionStatus(result.connections)
        setLastChecked(new Date())
      } else {
        console.error("Failed to test connections")
      }
    } catch (error) {
      console.error("Error testing connections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Test connections on component mount
    testConnections()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean) => {
    return <Badge variant={status ? "default" : "destructive"}>{status ? "Connected" : "Disconnected"}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Azure Services Status</CardTitle>
            <CardDescription>
              Monitor the connection status of all Azure services
              {lastChecked && (
                <span className="block text-xs mt-1">Last checked: {lastChecked.toLocaleTimeString()}</span>
              )}
            </CardDescription>
          </div>
          <Button onClick={testConnections} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Test Connections
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connectionStatus ? (
          <div className="space-y-4">
            {/* IoT Hub Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(connectionStatus.iotHub)}
                <div>
                  <div className="font-medium">Azure IoT Hub</div>
                  <div className="text-sm text-muted-foreground">Device connectivity and commands</div>
                </div>
              </div>
              {getStatusBadge(connectionStatus.iotHub)}
            </div>

            {/* SQL Database Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(connectionStatus.sqlDatabase)}
                <div>
                  <div className="font-medium">Azure SQL Database</div>
                  <div className="text-sm text-muted-foreground">Data storage and retrieval</div>
                </div>
              </div>
              {getStatusBadge(connectionStatus.sqlDatabase)}
            </div>

            {/* Anomaly Detector Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(connectionStatus.anomalyDetector)}
                <div>
                  <div className="font-medium">Azure Anomaly Detector</div>
                  <div className="text-sm text-muted-foreground">AI-powered pattern analysis</div>
                </div>
              </div>
              {getStatusBadge(connectionStatus.anomalyDetector)}
            </div>

            {/* Communication Services Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connectionStatus.communication.email)}
                  <div>
                    <div className="font-medium">Email Service</div>
                    <div className="text-sm text-muted-foreground">Email notifications</div>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.communication.email)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connectionStatus.communication.sms)}
                  <div>
                    <div className="font-medium">SMS Service</div>
                    <div className="text-sm text-muted-foreground">SMS notifications</div>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.communication.sms)}
              </div>
            </div>

            {/* Overall Status Summary */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {Object.values(connectionStatus).every((status) =>
                  typeof status === "boolean" ? status : Object.values(status).every((s) => s),
                ) ? (
                  <span className="text-green-600 font-medium">All Azure services are connected and operational</span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    Some Azure services are not connected. Check your configuration and environment variables.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {isLoading ? "Testing connections..." : 'Click "Test Connections" to check Azure services status'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
