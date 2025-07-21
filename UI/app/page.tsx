"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, Users, Settings } from "lucide-react"
import Link from "next/link"

// Mock users for login selection
// const mockUsers = [
//   { id: 1, name: "John Doe", email: "john.doe@company.com", role: "Manager", gender: "Male" },
//   { id: 2, name: "Jane Smith", email: "jane.smith@company.com", role: "Senior", gender: "Female" },
//   { id: 3, name: "Mike Johnson", email: "mike.johnson@company.com", role: "Project Engineer", gender: "Male" },
//   { id: 4, name: "Sarah Wilson", email: "sarah.wilson@company.com", role: "Manager", gender: "Female" },
// ]

export default function LoginPage() {

const handleLogin = async () => {
window.location.href = "http://localhost:5001/login";
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">Soliton Internal Management</h1>
            </div>
            <p className="text-gray-600">Apartment Accommodation Portal</p>
          </div>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Employee Login */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
               
                <Button onClick={handleLogin}  className="w-full">
                  Continue to Booking
                </Button>
              </CardContent>
            </Card>

            {/* Admin Login */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Admin Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Access admin dashboard to manage requests, occupancy, and system configuration.
                </p>
                <div className="space-y-2">
                  <Link href="/admin/requests">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage Requests
                    </Button>
                  </Link>
                  <Link href="/admin/occupancy">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Building2 className="h-4 w-4 mr-2" />
                      Occupancy Overview
                    </Button>
                  </Link>
                  <Link href="/admin/management">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Settings className="h-4 w-4 mr-2" />
                      System Management
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
