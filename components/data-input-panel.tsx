"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Droplets, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react"

interface DataInputPanelProps {
  onDataSubmit: (data: {
    houseId: string
    flowRate: number
    pressure: number
    scenario: string
  }) => void
}

export default function DataInputPanel({ onDataSubmit }: DataInputPanelProps) {
  const [selectedHouse, setSelectedHouse] = useState("")
  const [flowRate, setFlowRate] = useState([45])
  const [pressure, setPressure] = useState([2.5])
  const [scenario, setScenario] = useState("")

  const households = [
    { id: "H001", name: "Rajesh Kumar", location: "Ward 1" },
    { id: "H002", name: "Priya Sharma", location: "Ward 1" },
    { id: "H003", name: "Amit Patel", location: "Ward 2" },
    { id: "H004", name: "Sunita Devi", location: "Ward 2" },
    { id: "H005", name: "Ravi Singh", location: "Ward 3" },
  ]

  const scenarios = [
    { value: "normal", label: "Normal Flow", icon: Activity, color: "default" },
    { value: "theft", label: "Theft (Spike)", icon: TrendingUp, color: "destructive" },
    { value: "leak", label: "Leak (Drop)", icon: Droplets, color: "secondary" },
    { value: "blockage", label: "Blockage (Zero)", icon: TrendingDown, color: "outline" },
  ]

  const handleManualSubmit = () => {
    if (!selectedHouse || !scenario) return

    onDataSubmit({
      houseId: selectedHouse,
      flowRate: flowRate[0],
      pressure: pressure[0],
      scenario,
    })
  }

  const handleQuickScenario = (scenarioType: string) => {
    if (!selectedHouse) {
      setSelectedHouse("H001") // Default to first house
    }

    let simulatedFlow = 45
    let simulatedPressure = 2.5

    switch (scenarioType) {
      case "normal":
        simulatedFlow = 40 + Math.random() * 10
        simulatedPressure = 2.3 + Math.random() * 0.4
        break
      case "theft":
        simulatedFlow = 80 + Math.random() * 20 // High spike
        simulatedPressure = 1.8 + Math.random() * 0.3 // Lower pressure due to high usage
        break
      case "leak":
        simulatedFlow = 15 + Math.random() * 10 // Continuous low flow
        simulatedPressure = 3.0 + Math.random() * 0.5 // Higher pressure due to leak
        break
      case "blockage":
        simulatedFlow = 0 + Math.random() * 2 // Near zero flow
        simulatedPressure = 3.5 + Math.random() * 0.3 // Very high pressure due to blockage
        break
    }

    setFlowRate([simulatedFlow])
    setPressure([simulatedPressure])
    setScenario(scenarioType)

    onDataSubmit({
      houseId: selectedHouse || "H001",
      flowRate: simulatedFlow,
      pressure: simulatedPressure,
      scenario: scenarioType,
    })
  }

  return (
    <div className="space-y-6">
      {/* Quick Simulation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Scenario Testing
          </CardTitle>
          <CardDescription>Click buttons to instantly simulate different water usage scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon
              return (
                <Button
                  key={scenario.value}
                  variant={scenario.color as any}
                  onClick={() => handleQuickScenario(scenario.value)}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{scenario.label}</span>
                </Button>
              )
            })}
          </div>
          {selectedHouse && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Testing scenarios for: <span className="font-medium">{selectedHouse}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Data Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Data Entry</CardTitle>
          <CardDescription>Enter specific values to test custom scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* House Selection */}
          <div className="space-y-2">
            <Label htmlFor="house-select">House ID</Label>
            <Select value={selectedHouse} onValueChange={setSelectedHouse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a household" />
              </SelectTrigger>
              <SelectContent>
                {households.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.id} - {house.name} ({house.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flow Rate Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Flow Rate (L/min)</Label>
              <Badge variant="outline">{flowRate[0].toFixed(1)} L/min</Badge>
            </div>
            <Slider value={flowRate} onValueChange={setFlowRate} max={120} min={0} step={0.5} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 L/min</span>
              <span>Normal: 40-50</span>
              <span>120 L/min</span>
            </div>
          </div>

          {/* Pressure Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pressure (bar)</Label>
              <Badge variant="outline">{pressure[0].toFixed(1)} bar</Badge>
            </div>
            <Slider value={pressure} onValueChange={setPressure} max={5} min={0} step={0.1} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 bar</span>
              <span>Normal: 2.0-3.0</span>
              <span>5 bar</span>
            </div>
          </div>

          {/* Scenario Type */}
          <div className="space-y-2">
            <Label>Scenario Type</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Select scenario type" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.value} value={scenario.value}>
                    {scenario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button onClick={handleManualSubmit} className="w-full" disabled={!selectedHouse || !scenario}>
            Submit Data
          </Button>
        </CardContent>
      </Card>

      {/* Current Values Display */}
      {selectedHouse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Test Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">House ID</p>
                <p className="font-medium">{selectedHouse}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Scenario</p>
                <p className="font-medium capitalize">{scenario || "Not selected"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Flow Rate</p>
                <p className="font-medium">{flowRate[0].toFixed(1)} L/min</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pressure</p>
                <p className="font-medium">{pressure[0].toFixed(1)} bar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
