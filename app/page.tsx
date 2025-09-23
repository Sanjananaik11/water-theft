"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Shield, Activity, Users, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-blue-600 rounded-full shadow-lg">
              <Droplets className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">Kandavara Panchayat</h1>
              <p className="text-2xl text-blue-600 dark:text-blue-400 font-semibold">Water Management System</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">Smart Water Monitoring & Theft Detection</span>
          </div>

          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Welcome to our advanced water monitoring system. Monitor household water usage, detect anomalies, and ensure
            fair distribution across our community.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-4">
                <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                Monitor water flow rates and pressure levels across all connected households in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Theft Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                Advanced algorithms detect unusual usage patterns and potential water theft incidents.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Community Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                Manage water distribution fairly across all households and wards in the panchayat.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Monitor Water Usage?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Access the comprehensive dashboard to start monitoring household water usage, view analytics, and manage
              alerts.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700">
                Enter Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Kandavara Panchayat Water Management System - Serving our community with smart technology
          </p>
        </div>
      </div>
    </div>
  )
}
