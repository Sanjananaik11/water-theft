"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import {
  AlertTriangle,
  Droplets,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import AlertManagementPanel from "@/components/alert-management-panel"
import DataInputPanel from "@/components/data-input-panel"
import { BroadcastAlertPanel } from "@/components/broadcast-alert-panel"
import { realtimeProcessor } from "@/lib/realtime-processor"

// Mock data for water monitoring
const generateMockData = () => {
  const households = [
    { id: "H001", name: "Rajesh Kumar", location: "Ward 1", normalFlow: 45 },
    { id: "H002", name: "Priya Sharma", location: "Ward 1", normalFlow: 38 },
    { id: "H003", name: "Amit Patel", location: "Ward 2", normalFlow: 52 },
    { id: "H004", name: "Sunita Devi", location: "Ward 2", normalFlow: 41 },
    { id: "H005", name: "Ravi Singh", location: "Ward 3", normalFlow: 47 },
  ]

  return households.map((house) => ({
    ...house,
    currentFlow: house.normalFlow + (Math.random() - 0.5) * 20,
    pressure: 2.5 + (Math.random() - 0.5) * 0.8,
    status: Math.random() > 0.8 ? "anomaly" : "normal",
    lastUpdated: new Date().toLocaleTimeString(),
  }))
}

const generateTimeSeriesData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return hours.map((hour) => ({
    time: `${hour}:00`,
    flow: 40 + Math.sin(hour / 4) * 15 + (Math.random() - 0.5) * 10,
    pressure: 2.5 + Math.sin(hour / 6) * 0.3 + (Math.random() - 0.5) * 0.2,
  }))
}

export default function WaterMonitoringDashboard() {
  const [householdData, setHouseholdData] = useState(generateMockData())
  const [timeSeriesData] = useState(generateTimeSeriesData())
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: "theft",
      household: "H003",
      message: "Unusual spike in water usage detected",
      time: "10:45 AM",
      severity: "high",
    },
    {
      id: 2,
      type: "leak",
      household: "H001",
      message: "Continuous water flow detected overnight",
      time: "09:30 AM",
      severity: "medium",
    },
    {
      id: 3,
      type: "blockage",
      household: "H005",
      message: "Zero flow detected for 2 hours",
      time: "08:15 AM",
      severity: "high",
    },
  ])

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([])

  useEffect(() => {
    // Set up real-time event listeners
    realtimeProcessor.addEventListener("connection", (data) => {
      console.log("[v0] Connected to real-time monitoring")
      setConnectionStatus("connected")
    })

    realtimeProcessor.addEventListener("sensor_update", (data) => {
      if (data.sensorData) {
        // Update household data with real-time readings
        const updatedData = data.sensorData.map((reading) => ({
          id: reading.householdId,
          name: getHouseholdName(reading.householdId),
          location: getHouseholdLocation(reading.householdId),
          normalFlow: getHouseholdNormalFlow(reading.householdId),
          currentFlow: reading.flowRate,
          pressure: reading.pressure,
          status: data.anomalies?.some((a) => a.householdId === reading.householdId && a.anomalyType !== "none")
            ? "anomaly"
            : "normal",
          lastUpdated: new Date(reading.timestamp).toLocaleTimeString(),
        }))
        setHouseholdData(updatedData)
      }
    })

    realtimeProcessor.addEventListener("alert", (data) => {
      if (data.alert) {
        const newAlert = {
          id: Date.now(),
          type: data.alert.anomalyType,
          household: data.alert.householdId,
          message: data.alert.message,
          time: new Date(data.alert.timestamp).toLocaleTimeString(),
          severity: data.alert.severity,
        }
        setRealtimeAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep last 10 alerts
      }
    })

    realtimeProcessor.addEventListener("error", (data) => {
      console.error("[v0] Real-time monitoring error:", data.message)
      setConnectionStatus("error")
    })

    return () => {
      realtimeProcessor.stopMonitoring()
    }
  }, [])

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      realtimeProcessor.stopMonitoring()
      setIsMonitoring(false)
      setConnectionStatus("disconnected")
    } else {
      try {
        setConnectionStatus("connecting")
        await realtimeProcessor.startMonitoring()
        setIsMonitoring(true)
      } catch (error) {
        console.error("[v0] Failed to start monitoring:", error)
        setConnectionStatus("error")
      }
    }
  }

  // Helper functions for real-time data
  const getHouseholdName = (id: string) => {
    const names: Record<string, string> = {
      H001: "Rajesh Kumar",
      H002: "Priya Sharma",
      H003: "Amit Patel",
      H004: "Sunita Devi",
      H005: "Ravi Singh",
    }
    return names[id] || "Unknown"
  }

  const getHouseholdLocation = (id: string) => {
    const locations: Record<string, string> = {
      H001: "Ward 1",
      H002: "Ward 1",
      H003: "Ward 2",
      H004: "Ward 2",
      H005: "Ward 3",
    }
    return locations[id] || "Unknown"
  }

  const getHouseholdNormalFlow = (id: string) => {
    const flows: Record<string, number> = {
      H001: 45,
      H002: 38,
      H003: 52,
      H004: 41,
      H005: 47,
    }
    return flows[id] || 45
  }

  // Simulate real-time updates (fallback when not using real-time processor)
  useEffect(() => {
    if (!isMonitoring) {
      const interval = setInterval(() => {
        setHouseholdData(generateMockData())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  const totalHouseholds = householdData.length
  const activeAnomalies = householdData.filter((h) => h.status === "anomaly").length
  const avgFlow = householdData.reduce((sum, h) => sum + h.currentFlow, 0) / totalHouseholds
  const avgPressure = householdData.reduce((sum, h) => sum + h.pressure, 0) / totalHouseholds

  const getStatusColor = (status: string) => {
    switch (status) {
      case "anomaly":
        return "destructive"
      case "normal":
        return "default"
      default:
        return "secondary"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "theft":
        return <TrendingUp className="h-4 w-4" />
      case "leak":
        return <Droplets className="h-4 w-4" />
      case "blockage":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleDataInput = async (inputData: {
    houseId: string
    flowRate: number
    pressure: number
    scenario: string
  }) => {
    try {
      // Send data to the water-data API
      const response = await fetch("/api/water-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          householdId: inputData.houseId,
          flowRate: inputData.flowRate,
          pressure: inputData.pressure,
          scenario: inputData.scenario,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        // Update the household data immediately for visual feedback
        setHouseholdData((prev) =>
          prev.map((house) =>
            house.id === inputData.houseId
              ? {
                  ...house,
                  currentFlow: inputData.flowRate,
                  pressure: inputData.pressure,
                  status: inputData.scenario === "normal" ? "normal" : "anomaly",
                  lastUpdated: new Date().toLocaleTimeString(),
                }
              : house,
          ),
        )

        // Trigger anomaly detection
        const anomalyResponse = await fetch("/api/anomaly-detection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            householdId: inputData.houseId,
            flowRate: inputData.flowRate,
            pressure: inputData.pressure,
            timestamp: new Date().toISOString(),
          }),
        })

        if (anomalyResponse.ok) {
          const anomalyResult = await anomalyResponse.json()

          // If anomaly detected, add to alerts
          if (anomalyResult.anomalyType !== "none") {
            const newAlert = {
              id: Date.now(),
              type: anomalyResult.anomalyType,
              household: inputData.houseId,
              message: anomalyResult.message,
              time: new Date().toLocaleTimeString(),
              severity: anomalyResult.confidence > 0.8 ? "high" : "medium",
            }
            setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep last 10 alerts
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error submitting data:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Welcome
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Water Monitoring Dashboard</h1>
                <p className="text-xl text-muted-foreground">Kandavara Panchayat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="lg"
            className="flex items-center gap-2"
          >
            {connectionStatus === "connected" ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            {isMonitoring ? "Stop Monitoring" : "Start Real-time Monitoring"}
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <div
              className={`h-3 w-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-gray-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              {connectionStatus === "connected"
                ? "Live Monitoring Active"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "error"
                    ? "Connection Error"
                    : "Ready to Monitor"}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Households</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHouseholds}</div>
              <p className="text-xs text-muted-foreground">Connected to system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{activeAnomalies}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Flow Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgFlow.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">L/min</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pressure</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPressure.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">bar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="monitoring" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="testing">Data Input & Testing</TabsTrigger>
            <TabsTrigger value="alerts">Alert Management</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            {realtimeAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Alerts</CardTitle>
                  <CardDescription>Real-time anomaly detections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {realtimeAlerts.slice(0, 3).map((alert) => (
                      <Alert key={alert.id} className={alert.severity === "high" ? "border-destructive" : ""}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">
                            {alert.household}: {alert.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Household Status */}
            <Card>
              <CardHeader>
                <CardTitle>Household Water Usage</CardTitle>
                <CardDescription>Real-time flow rates and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {householdData.map((household) => (
                    <div key={household.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{household.name}</span>
                          <Badge variant={getStatusColor(household.status)}>{household.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {household.location} • {household.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{household.currentFlow.toFixed(1)} L/min</div>
                        <div className="text-sm text-muted-foreground">{household.pressure.toFixed(1)} bar</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest anomaly detections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert key={alert.id} className={alert.severity === "high" ? "border-destructive" : ""}>
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="font-medium">
                              {alert.household}: {alert.message}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                          </AlertDescription>
                        </div>
                        <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flow Rate Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>24-Hour Flow Rate Trend</CardTitle>
                  <CardDescription>Average water flow throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="flow" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pressure Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Pressure Distribution</CardTitle>
                  <CardDescription>Current pressure levels by household</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={householdData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="id" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pressure" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <DataInputPanel onDataSubmit={handleDataInput} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AlertManagementPanel />
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-4">
            <BroadcastAlertPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
