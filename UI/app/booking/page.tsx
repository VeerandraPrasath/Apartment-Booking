"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, MapPin, Clock, User, Users, AlertTriangle } from "lucide-react"
import { format, differenceInDays } from "date-fns"

import { submitBookingRequest } from "@/lib/api"

const timeSlots = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
]

const mockUsers = [
  { id: 1, name: "John Doe", email: "john.doe@company.com", role: "Manager" },
  { id: 2, name: "Jane Smith", email: "jane.smith@company.com", role: "Senior" },
  { id: 3, name: "Mike Johnson", email: "mike.johnson@company.com", role: "Project Engineer" },
  { id: 4, name: "Sarah Wilson", email: "sarah.wilson@company.com", role: "Manager" },
]

export default function BookingPage() {
  
const [cities, setCities] = useState<{ id: number; name: string }[]>([])
const [users, setUsers] = useState<{ id: number; name: string; email: string; role: string }[]>([])

  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedCity, setSelectedCity] = useState<string>("")
 const [selectedDates, setSelectedDates] = useState<{ from: Date | undefined; to?: Date | undefined }>({
  from: undefined,
  to: undefined,
})
  const [showSidebar, setShowSidebar] = useState(false)
  const [checkInTime, setCheckInTime] = useState("08:00")
  const [checkOutTime, setCheckOutTime] = useState("10:00")
  const [bookingFor, setBookingFor] = useState("")
  const [bookingType, setBookingType] = useState("individual") // "individual" or "team"
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [showLowAvailability, setShowLowAvailability] = useState(false)
  const [dateWarning, setDateWarning] = useState("")

 useEffect(() => {
    // Try to get user from query params first
    const name = searchParams.get("name")
    const email = searchParams.get("email")
    const id = searchParams.get("id")
    const role = searchParams.get("jobTitle")

    if (name && email && id && role) {
      const user = { name, email, id, role }
      setCurrentUser(user)
      setBookingFor(email)
      localStorage.setItem("currentUser", JSON.stringify(user))
      return
    }

    // Fallback to localStorage if no query params
    // const user = localStorage.getItem("currentUser")
    // if (user) {
    //   const parsedUser = JSON.parse(user)
    //   setCurrentUser(parsedUser)
    //   setBookingFor(parsedUser.email)
    // }
  }, [searchParams])

useEffect(() => {
  // Fetch cities from API
  fetch("http://localhost:5001/api/cities")
    .then((res) => res.json())
    .then((data) => setCities(data))
    .catch(() => setCities([]))

  // Fetch users from API
  fetch("http://localhost:5001/api/users")
    .then((res) => res.json())
    .then((data) => setUsers(data))
    .catch(() => setUsers([]))
}, [])

 

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setDateWarning("") // Clear any existing warning

    if (!selectedDates.from) {
      // First click - set start date
      setSelectedDates({ from: date, to: undefined })
      setShowSidebar(false)
    } else if (!selectedDates.to) {
      // Second click - set end date
      if (date >= selectedDates.from) {
        const daysDiff = differenceInDays(date, selectedDates.from)
        if (daysDiff <= 13) {
          // 13 days difference = 14 days total (inclusive)
          setSelectedDates({ from: selectedDates.from, to: date })
          setShowSidebar(true)
          setShowLowAvailability(Math.random() > 0.7)
        } else {
          setDateWarning("Maximum stay is 14 days. Please select a shorter duration.")
          // Reset selection
          setSelectedDates({ from: undefined, to: undefined })
          setShowSidebar(false)
        }
      } else {
        // If clicked date is before start date, reset and set as new start date
        setSelectedDates({ from: date, to: undefined })
        setShowSidebar(false)
      }
    } else {
      // Third click - reset and set new start date
      setSelectedDates({ from: date, to: undefined })
      setShowSidebar(false)
    }
  }

  const handleDoubleClick = (date: Date) => {
    setSelectedDates({ from: date, to: date })
    setShowSidebar(true)
    setShowLowAvailability(Math.random() > 0.7)
  }

  const getDuration = () => {
    if (selectedDates.from && selectedDates.to) {
      return differenceInDays(selectedDates.to, selectedDates.from) + 1
    }
    return 0
  }

  const addTeamMember = (email: string) => {
    if (email && !teamMembers.includes(email)) {
      setTeamMembers([...teamMembers, email])
    }
  }

  const removeTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter((member) => member !== email))
  }


const handleSubmitRequest = async () => {
  // ...validation logic...
  try {
    const data = await submitBookingRequest({
      currentUser,
      selectedCity,
      selectedDates,
      checkInTime,
      checkOutTime,
      bookingFor,
      bookingType,
      teamMembers,
    })
    if (data.success) {
      alert(data.message + " Request ID: " + data.requestId)
      console.log("Booking successful:", data)
      // Reset form...
    } else {
      alert("Booking failed: " + (data.message || "Unknown error"))
      console.error("Booking failed:", data)
    }
  } catch (error) {
    alert("Booking failed: " + error)
    console.error("Booking error:", error)
  }
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
       <div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Book Accommodation</h1>
    <p className="text-gray-600">
      {currentUser ? `Welcome, ${currentUser.name}` : "Welcome"}
    </p>
  </div>
  {currentUser && <Badge variant="outline">{currentUser.role}</Badge>}
</div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* City Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Select City
                </CardTitle>
              </CardHeader>
             <CardContent>
  <Select value={selectedCity} onValueChange={setSelectedCity}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Choose a city" />
    </SelectTrigger>
    <SelectContent>
      {cities.map((city) => (
        <SelectItem key={city.id} value={city.name}>
          {city.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</CardContent>
            </Card>

            {/* Booking Type Selection */}
            {selectedCity && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Booking Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={bookingType} onValueChange={setBookingType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Booking</SelectItem>
                      <SelectItem value="team">Team Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Calendar */}
            {selectedCity && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Dates</CardTitle>
                  <p className="text-sm text-gray-600">
                    Click start date, then end date. Double-click for single day. Max 14 days.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Calendar
                      mode="range"
                      selected={selectedDates}
                      onSelect={(range) => {
                        setDateWarning("") // Clear any existing warning
                        if (range?.from) {
                          if (range.to) {
                            // Both dates selected via range selection
                            const daysDiff = differenceInDays(range.to, range.from)
                            if (daysDiff <= 13) {
                              // 13 days difference = 14 days total
                              setSelectedDates(range)
                              setShowSidebar(true)
                              setShowLowAvailability(Math.random() > 0.7)
                            } else {
                              setDateWarning("Maximum stay is 14 days. Please select a shorter duration.")
                              setSelectedDates({ from: range.from, to: undefined })
                              setShowSidebar(false)
                            }
                          } else {
                            // Only start date selected
                            setSelectedDates({ from: range.from, to: undefined })
                            setShowSidebar(false)
                          }
                        } else {
                          // Clear selection
                          setSelectedDates({ from: undefined, to: undefined })
                          setShowSidebar(false)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border w-fit"
                    />
                  </div>

                  {/* Date Warning */}
                  {dateWarning && (
                    <Alert className="mt-4 border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">{dateWarning}</AlertDescription>
                    </Alert>
                  )}

                  {selectedDates.from && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="p-3 bg-blue-50 rounded-lg flex-1 mr-2">
                        <p className="text-sm font-medium text-blue-900">
                          Selected: {format(selectedDates.from, "MMM dd")}
                          {selectedDates.to && ` - ${format(selectedDates.to, "MMM dd")}`}
                          {selectedDates.to && ` (${getDuration()} ${getDuration() === 1 ? "day" : "days"})`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDates({ from: undefined, to: undefined })
                          setShowSidebar(false)
                          setDateWarning("")
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Complete Your Request</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium">
                      <MapPin className="h-4 w-4 mr-2" />
                      Booking Summary
                    </div>
                    <div className="text-sm space-y-1 pl-6">
                      <p>
                        <strong>City:</strong> {selectedCity}
                      </p>
                      <p>
                        <strong>Type:</strong> {bookingType === "individual" ? "Individual" : "Team"}
                      </p>
                      <p>
                        <strong>Dates:</strong> {selectedDates.from && format(selectedDates.from, "MMM dd")} -{" "}
                        {selectedDates.to && format(selectedDates.to, "MMM dd")}
                      </p>
                      <p>
                        <strong>Duration:</strong> {getDuration()} {getDuration() === 1 ? "day" : "days"}
                      </p>
                    </div>
                  </div>

                  {/* Check-in Time */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium">
                      <Clock className="h-4 w-4 mr-2" />
                      Check-in Time
                    </div>
                    <Select value={checkInTime} onValueChange={setCheckInTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Check-out Time */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium">
                      <Clock className="h-4 w-4 mr-2" />
                      Check-out Time
                    </div>
                    <Select value={checkOutTime} onValueChange={setCheckOutTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Individual Booking For */}
                  {bookingType === "individual" && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <User className="h-4 w-4 mr-2" />
                        Booking For
                      </div>
                      <Select value={bookingFor} onValueChange={setBookingFor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
  {users.map((user) => (
    <SelectItem key={user.id} value={user.email}>
      {user.name} ({user.role})
    </SelectItem>
  ))}
</SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Team Booking Members */}
                  {bookingType === "team" && (
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center text-sm font-medium">
                        <Users className="h-4 w-4 mr-2" />
                        Team Members
                      </div>

                      <div>
                        <label className="text-sm font-medium">Add Team Members</label>
                        <Select onValueChange={addTeamMember}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select member to add" />
                          </SelectTrigger>
                         <SelectContent>
  {users
    .filter((user) => !teamMembers.includes(user.email))
    .map((user) => (
      <SelectItem key={user.id} value={user.email}>
        {user.name} ({user.role})
      </SelectItem>
    ))}
</SelectContent>
                        </Select>
                      </div>

                      {teamMembers.length > 0 && (
                        <div>
                          <label className="text-sm font-medium">Team Members ({teamMembers.length})</label>
                          <div className="mt-1 space-y-1">
                            {teamMembers.map((email) => (
                              <div
                                key={email}
                                className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                              >
                                <span>
                                  {users.find((u) => u.email === email)?.name} (
                                  {users.find((u) => u.email === email)?.role})
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => removeTeamMember(email)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Low Availability Warning */}
                  {showLowAvailability && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        ⚠️ Apartment availability is low during the selected period
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitRequest}
                    className="w-full"
                    disabled={
                      !selectedCity ||
                      !selectedDates.from ||
                      !selectedDates.to ||
                      (bookingType === "individual" && !bookingFor) ||
                      (bookingType === "team" && teamMembers.length === 0)
                    }
                  >
                    Request Accommodation
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}