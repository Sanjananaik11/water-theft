"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Send, Users, MessageSquare, Mail, Phone, CheckCircle, XCircle, Clock } from "lucide-react"

interface BroadcastMessage {
  id: string
  title: string
  message: string
  priority: "low" | "medium" | "high" | "emergency"
  channels: ("email" | "sms" | "whatsapp")[]
  targetGroups: ("all" | "officials" | "residents" | "maintenance" | "emergency")[]
  sentBy: string
  timestamp: string
  recipientCount: number
  deliveryStatus: {
    sent: number
    delivered: number
    failed: number
  }
}

interface Recipient {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  groups: string[]
  active: boolean
}

export function BroadcastAlertPanel() {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "emergency">("medium")
  const [channels, setChannels] = useState<("email" | "sms" | "whatsapp")[]>(["email"])
  const [targetGroups, setTargetGroups] = useState<("all" | "officials" | "residents" | "maintenance" | "emergency")[]>(
    ["all"],
  )

  // Load data
  useEffect(() => {
    loadBroadcasts()
    loadRecipients()
  }, [])

  const loadBroadcasts = async () => {
    try {
      const response = await fetch("/api/broadcast")
      const data = await response.json()
      if (data.success) {
        setBroadcasts(data.broadcasts)
      }
    } catch (error) {
      console.error("Error loading broadcasts:", error)
    }
  }

  const loadRecipients = async () => {
    try {
      const response = await fetch("/api/recipients?active=true")
      const data = await response.json()
      if (data.success) {
        setRecipients(data.recipients)
      }
    } catch (error) {
      console.error("Error loading recipients:", error)
    }
  }

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please fill in title and message")
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          priority,
          channels,
          targetGroups,
          sentBy: "admin@kandavara.gov.in",
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTitle("")
        setMessage("")
        setPriority("medium")
        setChannels(["email"])
        setTargetGroups(["all"])
        loadBroadcasts()
        alert(`Broadcast sent successfully! Delivered to ${data.deliveryStatus.delivered} recipients.`)
      } else {
        alert("Failed to send broadcast: " + data.error)
      }
    } catch (error) {
      console.error("Error sending broadcast:", error)
      alert("Failed to send broadcast")
    } finally {
      setSending(false)
    }
  }

  const handleChannelChange = (channel: "email" | "sms" | "whatsapp", checked: boolean) => {
    if (checked) {
      setChannels([...channels, channel])
    } else {
      setChannels(channels.filter((c) => c !== channel))
    }
  }

  const handleTargetGroupChange = (
    group: "all" | "officials" | "residents" | "maintenance" | "emergency",
    checked: boolean,
  ) => {
    if (checked) {
      if (group === "all") {
        setTargetGroups(["all"])
      } else {
        setTargetGroups((prev) => prev.filter((g) => g !== "all").concat(group))
      }
    } else {
      setTargetGroups(targetGroups.filter((g) => g !== group))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "text-red-600 bg-red-50"
      case "high":
        return "text-orange-600 bg-orange-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getTargetRecipientsCount = () => {
    if (targetGroups.includes("all")) {
      return recipients.length
    }
    return recipients.filter((r) => r.groups.some((g) => targetGroups.includes(g as any))).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Broadcast Alert System</h2>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
          <TabsTrigger value="recipients">Manage Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Alert to All People
              </CardTitle>
              <CardDescription>Send emergency alerts and notifications to all registered recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Alert Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Water Supply Emergency"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your alert message here..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Notification Channels</Label>
                  <div className="space-y-2">
                    {[
                      { id: "email", label: "Email", icon: Mail },
                      { id: "sms", label: "SMS", icon: Phone },
                      { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                    ].map(({ id, label, icon: Icon }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={channels.includes(id as any)}
                          onCheckedChange={(checked) => handleChannelChange(id as any, checked as boolean)}
                        />
                        <Icon className="h-4 w-4" />
                        <Label htmlFor={id}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Target Groups</Label>
                  <div className="space-y-2">
                    {[
                      { id: "all", label: "All Recipients", icon: Users },
                      { id: "officials", label: "Officials", icon: Users },
                      { id: "residents", label: "Residents", icon: Users },
                      { id: "maintenance", label: "Maintenance", icon: Users },
                      { id: "emergency", label: "Emergency Team", icon: AlertTriangle },
                    ].map(({ id, label, icon: Icon }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={targetGroups.includes(id as any)}
                          onCheckedChange={(checked) => handleTargetGroupChange(id as any, checked as boolean)}
                        />
                        <Icon className="h-4 w-4" />
                        <Label htmlFor={id}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Target Recipients: {getTargetRecipientsCount()}</span>
                </div>
                <Button
                  onClick={handleSendBroadcast}
                  disabled={sending || !title.trim() || !message.trim() || channels.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? "Sending..." : "Send Broadcast"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>Recent broadcast messages and delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <div key={broadcast.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{broadcast.title}</h4>
                        <p className="text-sm text-gray-600">{broadcast.message}</p>
                      </div>
                      <Badge className={getPriorityColor(broadcast.priority)}>{broadcast.priority.toUpperCase()}</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Sent: {new Date(broadcast.timestamp).toLocaleString()}</span>
                      <span>Recipients: {broadcast.recipientCount}</span>
                      <span>Groups: {broadcast.targetGroups.join(", ")}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Delivered: {broadcast.deliveryStatus.delivered}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Sent: {broadcast.deliveryStatus.sent}</span>
                      </div>
                      {broadcast.deliveryStatus.failed > 0 && (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Failed: {broadcast.deliveryStatus.failed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Management</CardTitle>
              <CardDescription>Manage people who receive broadcast alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{recipient.name}</h4>
                        <div className="flex gap-2 text-sm text-gray-600">
                          {recipient.email && <span>📧 {recipient.email}</span>}
                          {recipient.phone && <span>📱 {recipient.phone}</span>}
                          {recipient.whatsapp && <span>💬 WhatsApp</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {recipient.groups.map((group) => (
                          <Badge key={group} variant="outline" className="text-xs">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
