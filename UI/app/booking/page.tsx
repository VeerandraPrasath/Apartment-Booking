"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const teamMembersList = [
  { id: 1, name: "Shri Ram", role: "Manager" },
  { id: 2, name: "Veerandra Prasath", role: "Project Engineer" },
  { id: 3, name: "Ravi Kumar", role: "Developer" },
]

export default function TeamBookingPage() {
  const [city, setCity] = useState("Chennai")
  const [bookingType, setBookingType] = useState("team")
  const [selectedMembers, setSelectedMembers] = useState([teamMembersList[0], teamMembersList[1]])
  const [memberDetails, setMemberDetails] = useState(() => {
    const init = {}
    selectedMembers.forEach(m => {
      init[m.id] = {
        checkInDate: new Date(),
        checkInTime: "08:00",
        checkOutDate: new Date(new Date().getTime() + 86400000),
        checkOutTime: "10:00"
      }
    })
    return init
  })

  const handleMemberChange = (memberId, field, value) => {
    setMemberDetails(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      },
    }))
  }

  return (
    <div className="grid grid-cols-5 gap-6 p-6">
      {/* Booking Preferences */}
      <div className="col-span-2 space-y-6">
        <div>
          <Label className="text-lg">Select City</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Chennai">Chennai</SelectItem>
              <SelectItem value="Bangalore">Bangalore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-lg">Booking Type</Label>
          <Select value={bookingType} onValueChange={setBookingType}>
            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-lg">Add Team Members</Label>
          <Select onValueChange={(val) => {
            const member = teamMembersList.find(m => m.id === parseInt(val))
            if (member && !selectedMembers.find(m => m.id === member.id)) {
              setSelectedMembers(prev => [...prev, member])
              setMemberDetails(prev => ({
                ...prev,
                [member.id]: {
                  checkInDate: new Date(),
                  checkInTime: "08:00",
                  checkOutDate: new Date(new Date().getTime() + 86400000),
                  checkOutTime: "10:00"
                }
              }))
            }
          }}>
            <SelectTrigger><SelectValue placeholder="Add Member" /></SelectTrigger>
            <SelectContent>
              {teamMembersList.map(member => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name} ({member.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member Details - Right Column */}
      <div className="col-span-3 space-y-4">
        {selectedMembers.map(member => (
          <Card key={member.id} className="p-4 border rounded-lg">
            <div className="font-semibold text-base mb-2">{member.name} <span className="text-sm text-gray-500">({member.role})</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check-in Date</Label>
                <DatePicker
                  selected={memberDetails[member.id].checkInDate}
                  onChange={date => handleMemberChange(member.id, "checkInDate", date)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div>
                <Label>Check-in Time</Label>
                <Input
                  type="time"
                  value={memberDetails[member.id].checkInTime}
                  onChange={e => handleMemberChange(member.id, "checkInTime", e.target.value)}
                />
              </div>
              <div>
                <Label>Check-out Date</Label>
                <DatePicker
                  selected={memberDetails[member.id].checkOutDate}
                  onChange={date => handleMemberChange(member.id, "checkOutDate", date)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div>
                <Label>Check-out Time</Label>
                <Input
                  type="time"
                  value={memberDetails[member.id].checkOutTime}
                  onChange={e => handleMemberChange(member.id, "checkOutTime", e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button>Request Accommodation</Button>
        </div>
      </div>
    </div>
  )
}

