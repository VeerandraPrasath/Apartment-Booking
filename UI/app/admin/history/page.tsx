"use client"
 
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, User, Users, Download, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
 
 
import { fetchHistoryRequests, fetchCities } from "@/lib/api"
 
 
export default function AdminHistoryPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [filterCity, setFilterCity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRole, setFilterRole] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
 
  // Fetch cities for filter dropdown
  useEffect(() => {
    fetchCities()
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.map((c: any) => c.name))
        }
      })
      .catch(() => setCities([]))
  }, [])
 
  // Fetch requests from API when filters change
  useEffect(() => {
    fetchHistoryRequests({
      city: filterCity !== "all" ? filterCity : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      role: filterRole !== "all" ? filterRole : undefined,
      search: searchTerm || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((data) => {
        setRequests(data)
        // Set roles for filter dropdown
        const uniqueRoles = Array.from(new Set(data.map((req: any) => req.user?.role).filter(Boolean)))
        setRoles(uniqueRoles as string[])
      })
      .catch(() => {
        setRequests([])
        setRoles([])
      })
  }, [filterCity, filterStatus, filterRole, searchTerm, dateFrom, dateTo])
 
  const exportToExcel = () => {
    // TODO: Replace with API call
    // const response = await fetch('/api/requests/history/export', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filters: { city: filterCity, status: filterStatus, role: filterRole, search: searchTerm, dateFrom, dateTo } })
    // })
 
    const csvContent = [
      [
        "Request Date",
        "Requester",
        "Email",
        "Role",
        "City",
        "Check-in",
        "Check-out",
        "Duration",
        "Status",
        "Assigned Accommodation",
        "Type",
        "Team Members",
        "Remarks",
        "Processed Date",
      ],
      ...filteredRequests.map((req) => [
        format(new Date(req.timestamp), "yyyy-MM-dd HH:mm"),
        req.user.name,
        req.user.email,
        req.user.role,
        req.city,
        format(new Date(req.dates.from), "yyyy-MM-dd"),
        format(new Date(req.dates.to), "yyyy-MM-dd"),
        Math.ceil((new Date(req.dates.to).getTime() - new Date(req.dates.from).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        req.status,
        req.assignedAccommodations ? Object.values(req.assignedAccommodations).join("; ") : "N/A",
        req.bookingType === "team" ? "Team" : "Individual",
        req.bookingType === "team" && req.teamMembers ? req.teamMembers.join("; ") : "N/A",
        req.remarks || "N/A",
        req.processedAt ? format(new Date(req.processedAt), "yyyy-MM-dd HH:mm") : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")
 
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `booking-history-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
 
  const clearFilters = () => {
    setFilterCity("all")
    setFilterStatus("all")
    setFilterRole("all")
    setSearchTerm("")
    setDateFrom("")
    setDateTo("")
  }
 
 
  const filteredRequests = requests;
  const approvedCount = filteredRequests.filter((req) => req.status === "approved").length
  const rejectedCount = filteredRequests.filter((req) => req.status === "rejected").length
  const teamBookingsCount = filteredRequests.filter((req) => req.bookingType === "team").length
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking History</h1>
            <p className="text-gray-600">{filteredRequests.length} processed requests</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/requests">
              <Button variant="outline">Pending Requests</Button>
            </Link>
            <Link href="/admin/occupancy">
              <Button variant="outline">Occupancy View</Button>
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
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">✕</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Team Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{teamBookingsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Export
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={exportToExcel} className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-6 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
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
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
 
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
 
        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Booking History Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accommodation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No booking history found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm">
                            {format(new Date(request.timestamp), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {request.bookingType === "team" ? (
                                <Users className="h-4 w-4 mr-2 text-blue-600" />
                              ) : (
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                              )}
                              <div>
                                <div className="font-medium">{request.user.name}</div>
                                <div className="text-xs text-gray-500">{request.user.email}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {request.user.role}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {request.city}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(request.dates.from), "MMM dd")} -{" "}
                            {format(new Date(request.dates.to), "MMM dd")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {Math.ceil(
                              (new Date(request.dates.to).getTime() - new Date(request.dates.from).getTime()) /
                                (1000 * 60 * 60 * 24),
                            ) + 1}{" "}
                            days
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={request.status === "approved" ? "default" : "destructive"}
                              className={
                                request.status === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.assignedAccommodations && Object.keys(request.assignedAccommodations).length > 0 ? (
                              request.bookingType === "team" ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                                      View Team Assignments ({Object.keys(request.assignedAccommodations).length})
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh]">
                                    <DialogHeader>
                                      <DialogTitle>Team Accommodation Assignments</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="max-h-[60vh] pr-4">
                                      <div className="space-y-3">
                                        {Object.entries(request.assignedAccommodations).map(
                                          ([email, accommodation]) => {
                                            let user = null;
                                            if (email === request.user.email) {
                                              user = request.user;
                                            }
                                            if (!user) {
                                              user = { name: email, role: "Unknown" };
                                            }
                                            // Format accommodation as string if it's an object
                                            let accString = "Not assigned";
                                            if (typeof accommodation === "string") {
                                              accString = accommodation || "Not assigned";
                                            } else if (accommodation && typeof accommodation === "object") {
                                              accString = Object.values(accommodation).filter(Boolean).join(" > ") || "Not assigned";
                                            }
                                            return (
                                              <div
                                                key={email}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                              >
                                                <div>
                                                  <div className="font-medium">{user.name}</div>
                                                  <div className="text-sm text-gray-500">{email}</div>
                                                  <Badge variant="outline" className="text-xs mt-1">
                                                    {user.role}
                                                  </Badge>
                                                </div>
                                                <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                                                  {accString}
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <div className="font-mono text-sm">
                                  {(() => {
                                    const acc = Object.values(request.assignedAccommodations)[0];
                                    if (!acc) return "Not assigned";
                                    if (typeof acc === "string") return acc;
                                    if (typeof acc === "object") return Object.values(acc).filter(Boolean).join(" > ") || "Not assigned";
                                    return String(acc);
                                  })()}
                                </div>
                              )
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {request.bookingType === "team" ? "Team" : "Individual"}
                            </Badge>
                            {request.bookingType === "team" && request.teamMembers && (
                              <div className="text-xs text-gray-500 mt-1">{request.teamMembers.length} members</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.processedAt ? format(new Date(request.processedAt), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
 