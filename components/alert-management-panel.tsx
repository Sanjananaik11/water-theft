"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, CheckCircle, Clock, Mail, MessageSquare, Phone } from "lucide-react"
import { alertManager, type Alert as AlertType, type AlertRule } from "@/lib/alert-manager"

export default function AlertManagementPanel() {
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  useEffect(() => {
    loadAlerts()
    loadAlertRules()
  }, [selectedStatus])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const filters = selectedStatus !== "all" ? { status: selectedStatus } : {}
      const response = await alertManager.getAlerts(filters)
      setAlerts(response.alerts)
    } catch (error) {
      console.error("Failed to load alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAlertRules = async () => {
    try {
      const response = await alertManager.getAlertRules()
      setAlertRules(response.rules)
    } catch (error) {
      console.error("Failed to load alert rules:", error)
    }
  }

  const handleAlertAction = async (alertId: string, action: "acknowledge" | "resolve") => {
    try {
      await alertManager.updateAlertStatus(
        alertId,
        action === "acknowledge" ? "acknowledged" : "resolved",
        "admin@panchayat.gov",
      )
      loadAlerts() // Refresh alerts
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "theft":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "leak":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "blockage":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "acknowledged":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const activeAlerts = alerts.filter((a) => a.status === "active").length
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged").length
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved").length

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{acknowledgedAlerts}</div>
            <p className="text-xs text-muted-foreground">Being investigated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alert Queue</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Filters */}
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("all")}
            >
              All
            </Button>
            <Button
              variant={selectedStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("active")}
            >
              Active
            </Button>
            <Button
              variant={selectedStatus === "acknowledged" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("acknowledged")}
            >
              Acknowledged
            </Button>
            <Button
              variant={selectedStatus === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("resolved")}
            >
              Resolved
            </Button>
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No alerts found</div>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={`${alert.status === "active" ? "border-red-200" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.anomalyType)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.householdId}</span>
                            <Badge variant={alertManager.getSeverityColor(alert.severity) as any}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getStatusIcon(alert.status)}
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{alertManager.formatAlertAge(alert.timestamp)}</span>
                            {alert.notificationsSent.length > 0 && (
                              <span>Notifications: {alert.notificationsSent.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert.id, "acknowledge")}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {(alert.status === "active" || alert.status === "acknowledged") && (
                          <Button size="sm" onClick={() => handleAlertAction(alert.id, "resolve")}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.anomalyType.charAt(0).toUpperCase() + rule.anomalyType.slice(1)} detection rule
                      </CardDescription>
                    </div>
                    <Switch checked={rule.enabled} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Thresholds</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {rule.thresholds.flowMultiplier && (
                          <div>Flow multiplier: {rule.thresholds.flowMultiplier}x</div>
                        )}
                        {rule.thresholds.nightFlowThreshold && (
                          <div>Night flow: {rule.thresholds.nightFlowThreshold} L/min</div>
                        )}
                        {rule.thresholds.zeroFlowThreshold && (
                          <div>Zero flow: {rule.thresholds.zeroFlowThreshold} L/min</div>
                        )}
                        {rule.thresholds.minDuration && (
                          <div>Min duration: {rule.thresholds.minDuration / 60000} minutes</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Notifications</h4>
                      <div className="flex gap-2 mb-2">
                        {rule.notifications.email && <Mail className="h-4 w-4 text-blue-500" />}
                        {rule.notifications.sms && <Phone className="h-4 w-4 text-green-500" />}
                        {rule.notifications.whatsapp && <MessageSquare className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rule.notifications.recipients.length} recipients
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Email Recipients</Label>
                  <Input id="email-recipients" placeholder="admin@panchayat.gov, supervisor@panchayat.gov" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-recipients">SMS Recipients</Label>
                  <Input id="sms-recipients" placeholder="+91-9876543210, +91-9876543211" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="escalation" />
                <Label htmlFor="escalation">Enable automatic escalation</Label>
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
