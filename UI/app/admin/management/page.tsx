"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, Plus, Upload, Download, Edit, Trash2, Home, Bed, MapPin, ExternalLink, Minus } from "lucide-react"
import Link from "next/link"
import { fetchAccommodationHierarchy } from "@/lib/api"

const defaultHierarchy = {
 cities: [
            {
                id: 1,
                name: "Coimbatore"
            },
            {
                id: 2,
                name: "Chennai"
            }
        ],
        apartments: [
            {
                id: 1,
                name: "Apt1",
                city_id: 1,
                googleMapLink: "https://..."
            }
        ],
        flats: [
            {
                id: 1,
                name: "F1",
                apartment_id: 1
            }
        ],
        rooms: [
            {
                id: 1,
                name: "R2",
                flat_id: 1,
                beds: 3
            }
        ],
        beds: [
            {
                id: 1,
                name: "Bed 1",
                room_id: 1,
                status: "available",
                blocked_by: null
            }
            
        ]
    }

export default function AdminManagementPage() {
  const [hierarchy, setHierarchy] = useState(defaultHierarchy)
  const [selectedCity, setSelectedCity] = useState<any>(null)
  const [selectedApartment, setSelectedApartment] = useState<any>(null)
  const [selectedFlat, setSelectedFlat] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newApartmentMapLink, setNewApartmentMapLink] = useState("")
  const [roomsConfig, setRoomsConfig] = useState([{ name: "R1", beds: 2 }])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        setLoading(true)
        const hierarchy1 = await fetchAccommodationHierarchy()
        setHierarchy(hierarchy1)
        console.log("Fetched hierarchy:", hierarchy1)
        localStorage.setItem("accommodationHierarchy", JSON.stringify(hierarchy))
      } catch (error) {
        // fallback logic...
      } finally {
        setLoading(false)
      }
    }
    loadHierarchy()
  }, [])

  const saveHierarchy = (newHierarchy: any) => {
    // try {
    //   localStorage.setItem("accommodationHierarchy", JSON.stringify(newHierarchy))
    //   setHierarchy(newHierarchy)
    // } catch (error) {
    //   console.error("Error saving hierarchy:", error)
    //   alert("Error saving data. Please try again.")
    // }
  }

  // City CRUD
  const handleAddCity = () => {
    // if (!newItemName.trim()) return
    // try {
    //   const newCity = { id: Date.now(), name: newItemName.trim() }
    //   const updatedHierarchy = { ...hierarchy, cities: [...(hierarchy.cities || []), newCity] }
    //   saveHierarchy(updatedHierarchy)
    //   setNewItemName("")
    // } catch (error) {
    //   console.error("Error adding city:", error)
    //   alert("Error adding city. Please try again.")
    // }
  }

  const handleDeleteCity = (cityId: number) => {
    // if (!confirm("Are you sure you want to delete this city and all its data?")) return
    // try {
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     cities: (hierarchy.cities || []).filter((city) => city.id !== cityId),
    //     apartments: (hierarchy.apartments || []).filter((apt) => apt.cityId !== cityId),
    //     flats: (hierarchy.flats || []).filter((flat) => {
    //       const apartment = (hierarchy.apartments || []).find((apt) => apt.id === flat.apartmentId)
    //       return apartment?.cityId !== cityId
    //     }),
    //     rooms: (hierarchy.rooms || []).filter((room) => {
    //       const flat = (hierarchy.flats || []).find((f) => f.id === room.flatId)
    //       const apartment = (hierarchy.apartments || []).find((apt) => apt.id === flat?.apartmentId)
    //       return apartment?.cityId !== cityId
    //     }),
    //     beds: (hierarchy.beds || []).filter((bed) => {
    //       const room = (hierarchy.rooms || []).find((r) => r.id === bed.roomId)
    //       const flat = (hierarchy.flats || []).find((f) => f.id === room?.flatId)
    //       const apartment = (hierarchy.apartments || []).find((apt) => apt.id === flat?.apartmentId)
    //       return apartment?.cityId !== cityId
    //     }),
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   if (selectedCity?.id === cityId) {
    //     setSelectedCity(null)
    //     setSelectedApartment(null)
    //     setSelectedFlat(null)
    //   }
    // } catch (error) {
    //   console.error("Error deleting city:", error)
    //   alert("Error deleting city. Please try again.")
    // }
  }

  const handleUpdateCity = (cityId: number) => {
    // if (!editName.trim()) return
    // try {
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     cities: (hierarchy.cities || []).map((city) =>
    //       city.id === cityId ? { ...city, name: editName.trim() } : city,
    //     ),
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   setEditingItem(null)
    //   setEditName("")
    // } catch (error) {
    //   console.error("Error updating city:", error)
    //   alert("Error updating city. Please try again.")
    // }
  }

  // Apartment CRUD
  const handleAddApartment = () => {
    // if (!newItemName.trim() || !selectedCity) return
    // try {
    //   const newApartment = {
    //     id: Date.now(),
    //     name: newItemName.trim(),
    //     cityId: selectedCity.id,
    //     googleMapLink: newApartmentMapLink.trim() || "",
    //   }
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     apartments: [...(hierarchy.apartments || []), newApartment],
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   setNewItemName("")
    //   setNewApartmentMapLink("")
    // } catch (error) {
    //   console.error("Error adding apartment:", error)
    //   alert("Error adding apartment. Please try again.")
    // }
  }

  const handleDeleteApartment = (apartmentId: number) => {
    // if (!confirm("Are you sure you want to delete this apartment and all its data?")) return
    // try {
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     apartments: (hierarchy.apartments || []).filter((apt) => apt.id !== apartmentId),
    //     flats: (hierarchy.flats || []).filter((flat) => flat.apartmentId !== apartmentId),
    //     rooms: (hierarchy.rooms || []).filter((room) => {
    //       const flat = (hierarchy.flats || []).find((f) => f.id === room.flatId)
    //       return flat?.apartmentId !== apartmentId
    //     }),
    //     beds: (hierarchy.beds || []).filter((bed) => {
    //       const room = (hierarchy.rooms || []).find((r) => r.id === bed.roomId)
    //       const flat = (hierarchy.flats || []).find((f) => f.id === room?.flatId)
    //       return flat?.apartmentId !== apartmentId
    //     }),
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   if (selectedApartment?.id === apartmentId) {
    //     setSelectedApartment(null)
    //     setSelectedFlat(null)
    //   }
    // } catch (error) {
    //   console.error("Error deleting apartment:", error)
    //   alert("Error deleting apartment. Please try again.")
    // }
  }

  const handleUpdateApartment = (apartmentId: number) => {
    // if (!editName.trim()) return
    // try {
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     apartments: (hierarchy.apartments || []).map((apartment) =>
    //       apartment.id === apartmentId ? { ...apartment, name: editName.trim() } : apartment,
    //     ),
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   setEditingItem(null)
    //   setEditName("")
    // } catch (error) {
    //   console.error("Error updating apartment:", error)
    //   alert("Error updating apartment. Please try again.")
    // }
  }

  // Flat CRUD
  const handleAddFlat = () => {
    // if (!newItemName.trim() || !selectedApartment || roomsConfig.length === 0) return
    // try {
    //   const flatId = Date.now()
    //   const newFlat = {
    //     id: flatId,
    //     name: newItemName.trim(),
    //     apartmentId: selectedApartment.id,
    //     rooms: roomsConfig,
    //   }
    //   const newRooms = []
    //   const newBeds = []
    //   roomsConfig.forEach((roomConfig, index) => {
    //     const roomId = flatId + index
    //     newRooms.push({
    //       id: roomId,
    //       name: roomConfig.name,
    //       flatId: flatId,
    //       beds: roomConfig.beds,
    //     })
    //     for (let j = 0; j < roomConfig.beds; j++) {
    //       newBeds.push({
    //         id: roomId * 100 + j,
    //         name: `B${j + 1}`,
    //         roomId: roomId,
    //         status: null,
    //         blockedBy: null,
    //       })
    //     }
    //   })
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     flats: [...(hierarchy.flats || []), newFlat],
    //     rooms: [...(hierarchy.rooms || []), ...newRooms],
    //     beds: [...(hierarchy.beds || []), ...newBeds],
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   setNewItemName("")
    //   setRoomsConfig([{ name: "R1", beds: 2 }])
    // } catch (error) {
    //   console.error("Error adding flat:", error)
    //   alert("Error adding flat. Please try again.")
    // }
  }

  const handleDeleteFlat = (flatId: number) => {
    // if (!confirm("Are you sure you want to delete this flat and all its data?")) return
    // try {
    //   const updatedHierarchy = {
    //     ...hierarchy,
    //     flats: (hierarchy.flats || []).filter((flat) => flat.id !== flatId),
    //     rooms: (hierarchy.rooms || []).filter((room) => room.flatId !== flatId),
    //     beds: (hierarchy.beds || []).filter((bed) => {
    //       const room = (hierarchy.rooms || []).find((r) => r.id === bed.roomId)
    //       return room?.flatId !== flatId
    //     }),
    //   }
    //   saveHierarchy(updatedHierarchy)
    //   if (selectedFlat?.id === flatId) {
    //     setSelectedFlat(null)
    //   }
    // } catch (error) {
    //   console.error("Error deleting flat:", error)
    //   alert("Error deleting flat. Please try again.")
    // }
  }

  const handleUpdateFlat = (flatId: number) => {
    if (!editName.trim()) return
    try {
      const updatedHierarchy = {
        ...hierarchy,
        flats: (hierarchy.flats || []).map((flat) => (flat.id === flatId ? { ...flat, name: editName.trim() } : flat)),
      }
      saveHierarchy(updatedHierarchy)
      setEditingItem(null)
      setEditName("")
    } catch (error) {
      console.error("Error updating flat:", error)
      alert("Error updating flat. Please try again.")
    }
  }

  // Room config helpers
  const addRoom = () => {
    const newRoomNumber = roomsConfig.length + 1
    setRoomsConfig([...roomsConfig, { name: `R${newRoomNumber}`, beds: 2 }])
  }
  const removeRoom = (index: number) => {
    if (roomsConfig.length > 1) {
      setRoomsConfig(roomsConfig.filter((_, i) => i !== index))
    }
    }
  
  const updateRoomName = (index: number, name: string) => {
    const updated = [...roomsConfig]
    updated[index].name = name
    setRoomsConfig(updated)
  }
  const updateRoomBeds = (index: number, beds: number) => {
    const updated = [...roomsConfig]
    updated[index].beds = Math.max(1, beds)
    setRoomsConfig(updated)
  }

  // Filter helpers
  const getApartmentsForCity = (cityId: number) => {
    console.log("Fetching apartments for city:", cityId)
    let apartCount= (hierarchy.apartments || []).filter((apt) => apt.city_id === cityId)
    console.log("Apartments for city:", apartCount.length)
    return apartCount;
  }
  const getFlatsForApartment = (apartmentId: number) => {
    return (hierarchy.flats || []).filter((flat) => flat.apartment_id === apartmentId)
  }
  const getRoomsForFlat = (flatId: number) => {
    return (hierarchy.rooms || []).filter((room) => room.flat_id === flatId)
  }
  const getBedsForRoom = (roomId: number) => {
    return (hierarchy.beds || []).filter((bed) => bed.room_id === roomId)
  }

  // Export/Import
  const exportData = () => {
    const dataStr = JSON.stringify(hierarchy, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "accommodation-hierarchy.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          saveHierarchy(importedData)
          alert("Data imported successfully!")
        } catch (error) {
          alert("Error importing data. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accommodation data...</p>
        </div>
      </div>
    )
  }

  // ...rest of your UI code (unchanged, as in your original file)...
  // Paste your UI code here, starting from the main return statement.
  // (The code you provided after the loading check is correct and can be reused.)


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
            <p className="text-gray-600">Manage cities, apartments, flats, rooms, and beds hierarchy</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/requests">
              <Button variant="outline">Pending Requests</Button>
            </Link>
            <Link href="/admin/occupancy">
              <Button variant="outline">Occupancy View</Button>
            </Link>
            <Link href="/admin/history">
              <Button variant="outline">Booking History</Button>
            </Link>
          </div>
        </div>

        {/* Import/Export */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={exportData} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <div>
                <input type="file" accept=".json" onChange={importData} className="hidden" id="import-file" />
                <Button asChild variant="outline" className="flex items-center bg-transparent">
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Cities ({(hierarchy.cities || []).length})
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New City</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cityName">City Name</Label>
                      <Input
                        id="cityName"
                        placeholder="Enter city name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddCity} className="w-full">
                      Add City
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {(hierarchy.cities || []).map((city) => (
                <div
                  key={city.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCity?.id === city.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setSelectedCity(city)
                    setSelectedApartment(null)
                    setSelectedFlat(null)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-gray-500">{getApartmentsForCity(city.id).length} apartments</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItem({ id: city.id, type: "city" })
                          setEditName(city.name)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCity(city.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Apartments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Apartments {selectedCity && `(${getApartmentsForCity(selectedCity.id).length})`}
              </CardTitle>
              {selectedCity && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Apartment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="apartmentName">Apartment Name</Label>
                        <Input
                          id="apartmentName"
                          placeholder="e.g., Pricol, Sreevatsa Srilakshmi"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <div className="p-2 bg-gray-100 rounded border text-sm">{selectedCity.name}</div>
                      </div>
                      <div>
                        <Label htmlFor="googleMapLink">Google Map Link (Optional)</Label>
                        <Input
                          id="googleMapLink"
                          placeholder="https://maps.google.com/..."
                          value={newApartmentMapLink}
                          onChange={(e) => setNewApartmentMapLink(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Useful when sending accommodation details to users</p>
                      </div>
                      <Button onClick={handleAddApartment} className="w-full">
                        Add Apartment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {selectedCity ? (
                getApartmentsForCity(selectedCity.id).map((apartment) => (
                  <div
                    key={apartment.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedApartment?.id === apartment.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedApartment(apartment)
                      setSelectedFlat(null)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{apartment.name}</div>
                        <div className="text-xs text-gray-500">{getFlatsForApartment(apartment.id).length} flats</div>
                        {apartment.googleMapLink && (
                          <div className="mt-1">
                            <a
                              href={apartment.googleMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Map Link
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingItem({ id: apartment.id, type: "apartment" })
                            setEditName(apartment.name)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteApartment(apartment.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Select a city to view apartments</p>
              )}
            </CardContent>
          </Card>

          {/* Flats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Flats {selectedApartment && `(${getFlatsForApartment(selectedApartment.id).length})`}
              </CardTitle>
              {selectedApartment && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Add New Flat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Fixed form fields at top */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="flatName">Flat Name</Label>
                          <Input
                            id="flatName"
                            placeholder="e.g., C4, C6, A-13"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Apartment</Label>
                          <div className="p-2 bg-gray-100 rounded border text-sm">{selectedApartment.name}</div>
                        </div>
                      </div>

                      {/* Room Configuration Header - Fixed */}
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Rooms Configuration</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRoom(roomsConfig.length - 1)}
                            disabled={roomsConfig.length <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">{roomsConfig.length}</span>
                          <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Scrollable Table Only */}
                      <div className="border rounded-lg">
                        <ScrollArea className="h-64">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Room Name</TableHead>
                                <TableHead>Bed Count</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {roomsConfig.map((room, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Input
                                      value={room.name}
                                      onChange={(e) => updateRoomName(index, e.target.value)}
                                      placeholder={`R${index + 1}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateRoomBeds(index, room.beds - 1)}
                                        disabled={room.beds <= 1}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center text-sm font-medium">{room.beds}</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateRoomBeds(index, room.beds + 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeRoom(index)}
                                      disabled={roomsConfig.length <= 1}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>

                      {/* Fixed Add Button at bottom */}
                      <Button onClick={handleAddFlat} className="w-full">
                        Add Flat
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {selectedApartment ? (
                getFlatsForApartment(selectedApartment.id).map((flat) => (
                  <div
                    key={flat.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFlat?.id === flat.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedFlat(flat)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{flat.name}</div>
                        <div className="flex gap-2 mt-1">
  <Badge variant="outline">
    {
      getRoomsForFlat(flat.id).length
    } rooms
  </Badge>
  <Badge variant="secondary">
    {
      getRoomsForFlat(flat.id).reduce((total: number, room: any) => total + room.beds, 0)
    } beds
  </Badge>
</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingItem({ id: flat.id, type: "flat" })
                            setEditName(flat.name)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFlat(flat.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Select an apartment to view flats</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flat Details */}
        {selectedFlat && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bed className="h-5 w-5 mr-2" />
                {selectedFlat.name} - Room Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
  {getRoomsForFlat(selectedFlat.id).length > 0 ? (
    getRoomsForFlat(selectedFlat.id).map((room: any, index: number) => (
      <div key={index} className="border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{room.name}</div>
          <Badge variant="outline">{room.beds} beds</Badge>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: room.beds }, (_, bedIndex) => (
            <div key={bedIndex} className="text-center text-sm bg-gray-50 p-2 rounded border">
              B{bedIndex + 1}
            </div>
          ))}
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500 text-center py-4">No rooms configured for this flat</p>
  )}
</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingItem.type}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={`${editingItem.type} name`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={
                    editingItem.type === "city"
                      ? () => handleUpdateCity(editingItem.id)
                      : editingItem.type === "apartment"
                        ? () => handleUpdateApartment(editingItem.id)
                        : () => handleUpdateFlat(editingItem.id)
                  }
                  className="flex-1"
                >
                  Update
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

