"use client"
 
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Home, User, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchOccupancyData, fetchCities, fetchApartmentsByCityId } from "@/lib/api"
 
type OccupancyItem = {
  apartment: string
  flat: string
  room: string
  bed: string
  occupant: string | null
  checkIn: string | null
  checkOut: string | null
  status: string
  role: string | null
}
 
export default function AdminOccupancyPage() {
  const [occupancyData, setOccupancyData] = useState<OccupancyItem[]>([])
  const [filterCity, setFilterCity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterApartment, setFilterApartment] = useState("all")
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [apartments, setApartments] = useState<string[]>([])
 
  // Fetch cities on mount
  useEffect(() => {
    fetchCities()
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.map((c: any) => ({ id: String(c.id), name: c.name })))
        }
      })
      .catch(() => setCities([]))
  }, [])
 
  // Fetch apartments for selected city (by city ID) and reset apartment filter
  useEffect(() => {
    if (filterCity !== "all") {
      setFilterApartment("all");
      const cityObj = cities.find((c) => c.name === filterCity);
      if (cityObj) {
        fetchApartmentsByCityId(cityObj.id)
          .then((data) => {
            // The grouped endpoint returns an object with city name as key
            const cityKey = Object.keys(data)[0];
            if (cityKey && Array.isArray(data[cityKey])) {
              setApartments(data[cityKey].map((apt: any) => apt.name));
            } else {
              setApartments([]);
            }
          })
          .catch(() => setApartments([]));
      } else {
        setApartments([]);
      }
    } else {
      setFilterApartment("all");
      setApartments([]);
    }
  }, [filterCity, cities])
 
  // Fetch occupancy data when filters change
  useEffect(() => {
    fetchOccupancyData({
      city: filterCity !== "all" ? filterCity : undefined,
      apartment: filterApartment !== "all" ? filterApartment : undefined,
      is_booked:
        filterStatus === "occupied"
          ? true
          : filterStatus === "available"
          ? false
          : undefined,
    })
      .then((data) => setOccupancyData(data))
      .catch(() => setOccupancyData([]))
  }, [filterCity, filterApartment, filterStatus])
 
 
  const filteredData = occupancyData // Already filtered from API
 
  const exportToExcel = () => {
    // TODO: Replace with API call
    // const response = await fetch('/api/occupancy/export', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filters: { city: filterCity, status: filterStatus, apartment: filterApartment } })
    // })
 
    const csvContent = [
      ["Apartment", "Flat", "Room", "Bed", "Occupant", "Check-in", "Check-out", "Status", "Role"],
      ...filteredData.map((item) => [
        item.apartment,
        item.flat,
        item.room,
        item.bed,
        item.occupant || "N/A",
        item.checkIn || "N/A",
        item.checkOut || "N/A",
        item.status,
        item.role || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")
 
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "occupancy-report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }
 
 
  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-100 text-red-800"
      case "available":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
 
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Manager":
        return "bg-purple-100 text-purple-800"
      case "Senior":
        return "bg-blue-100 text-blue-800"
      case "Project Engineer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
 
 
  const occupiedCount = filteredData.filter((item) => item.status === "occupied").length
  const availableCount = filteredData.filter((item) => item.status === "available").length
  const totalCount = filteredData.length
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Occupancy Overview</h1>
            <p className="text-gray-600">Current accommodation status and occupancy</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/requests">
              <Button variant="outline">Pending Requests</Button>
            </Link>
            <Link href="/admin/management">
              <Button variant="outline">System Management</Button>
            </Link>
          </div>
        </div>
 
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{occupiedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">
                    {totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        {/* Filters and Export */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Export
              </CardTitle>
              <Button onClick={exportToExcel} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">Apartment</label>
                <Select value={filterApartment} onValueChange={setFilterApartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Apartments</SelectItem>
                    {apartments.map((apt) => (
                      <SelectItem key={apt} value={apt}>
                        {apt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
 
        {/* Occupancy Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Occupancy View</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apartment</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Occupant</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.apartment}</TableCell>
                        <TableCell>{item.flat}</TableCell>
                        <TableCell>{item.room}</TableCell>
                        <TableCell>{item.bed}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.occupant ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <div className="font-medium">{item.occupant}</div>
                                {item.role && (
                                  <Badge variant="outline" className={`text-xs mt-1 ${getRoleColor(item.role)}`}>
                                    {item.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{item.checkIn ? format(new Date(item.checkIn), "MMM dd, yyyy") : "-"}</TableCell>
                        <TableCell>{item.checkOut ? format(new Date(item.checkOut), "MMM dd, yyyy") : "-"}</TableCell>
                        <TableCell>
                          {item.checkIn && item.checkOut ? (
                            <span className="text-sm">
                              {Math.ceil(
                                (new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}{" "}
                              days
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
 