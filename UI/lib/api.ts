const BASE_URL = "http://localhost:5001";
import { format } from "date-fns"

export async function submitBookingRequest({
  currentUser,
  selectedCity,
  selectedDates,
  checkInTime,
  checkOutTime,
  bookingFor,
  bookingType,
  teamMembers,
}: {
  currentUser: { id: number; name: string; email: string }
  selectedCity: string
  selectedDates: { from: Date | undefined; to: Date | undefined }
  checkInTime: string
  checkOutTime: string
  bookingFor: string | null
  bookingType: string
  teamMembers: string[]
}) {
  const request = {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    },
    city: selectedCity,
    dates: {
      from: selectedDates.from ? format(selectedDates.from, "yyyy-MM-dd") : null,
      to: selectedDates.to ? format(selectedDates.to, "yyyy-MM-dd") : null,
    },
    checkInTime,
    checkOutTime,
    bookingFor: bookingType === "individual" ? bookingFor : null,
    bookingType,
    teamMembers: bookingType === "team" ? teamMembers : [],
  }

  const response = await fetch("http://localhost:5001/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  return response.json()
}

export async function fetchAccommodationHierarchy() {
  const response = await fetch("http://localhost:5001/api/accommodation/hierarchy")
  if (!response.ok) throw new Error("Failed to fetch accommodation hierarchy")
  const data = await response.json()
  if (data.success && data.hierarchy) {
    // console.log("Fetched hierarchy:", data.hierarchy)
    return data.hierarchy
  }
  throw new Error(data.message || "No hierarchy data found")
}

// api/cities.ts (client-side helper; NOT Next.js /api route)
export async function deleteCityApi(cityId: number): Promise<boolean> {
  const res = await fetch(`http://localhost:5001/api/cities/${cityId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    // Non-2xx: throw with status for caller to decide
    throw new Error(`Delete failed. HTTP ${res.status}`);
  }

  // Expect { success: true }
  const data = (await res.json()) as { success?: boolean };
  return !!data.success;
}

// api/apartments.ts (client-side API helper)
export async function createApartmentApi(apartmentData: {
  name: string;
  cityId: number;
  googleMapLink: string;
}): Promise<{ id: number; name: string; city_id: number; google_map_link: string }> {
  const res = await fetch("http://localhost:5001/api/apartments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apartmentData),
  });

  if (!res.ok) throw new Error(`Failed to create apartment. HTTP ${res.status}`);

  const data = await res.json();

  if (!data.success || !data.apartment) throw new Error("Unexpected server response");

  console.log("Created apartment:", data.apartment);
  return data.apartment;
}


export async function fetchOccupancyData({ city, apartment, is_booked }: { city?: string; apartment?: string; is_booked?: boolean } = {}) {
  const params = new URLSearchParams();
  if (city && city !== "all") params.append("city", city);
  if (apartment && apartment !== "all") params.append("apartment", apartment);
  if (typeof is_booked === "boolean") params.append("is_booked", String(is_booked));
  const url = `${BASE_URL}/api/occupancy${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch occupancy data");
  const data = await response.json();
  if (data.success && Array.isArray(data.data)) {
    return data.data.map((item: any) => ({
      apartment: item.apartment,
      flat: item.flat,
      room: item.room,
      bed: item.bed,
      occupant: item.occupant,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      status: item.is_booked === true ? "occupied" : "available",
      role: item.role,
    }));
  }
  return [];
}
 
// Fetch all cities from backend
export async function fetchCities() {
  const response = await fetch(`${BASE_URL}/api/cities`);
  if (!response.ok) throw new Error("Failed to fetch cities");
  return response.json();
}
 
 
// Fetch apartments for a city by city ID (grouped endpoint)
export async function fetchApartmentsByCityId(cityId?: string) {
  if (!cityId) return [];
  const url = `${BASE_URL}/api/apartments/city/${cityId}/grouped`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch apartments for city");
  return response.json();
}


export async function fetchHistoryRequests({ city, status, role, search, dateFrom, dateTo }: {
  city?: string;
  status?: string;
  role?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const params = new URLSearchParams();
  if (city && city !== "all") params.append("city", city);
  if (status && status !== "all") params.append("status", status);
  if (role && role !== "all") params.append("role", role);
  if (search) params.append("search", search);
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);
  const url = `${BASE_URL}/api/requests/history${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch booking history");
  const data = await response.json();
  if (data.success && Array.isArray(data.requests)) {
    return data.requests;
  }
  return [];
}

// export async function getBookings() {
//   const response = await fetch(`${BASE_URL}/api/bookings`);
//   if (!response.ok) throw new Error("Failed to fetch bookings");
//   return response.json();
// }

// export async function createBooking(data: any) {
//   const response = await fetch(`${BASE_URL}/api/bookings`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!response.ok) throw new Error("Failed to create booking");
//   return response.json();
// }

// export async function login() {
//   const response = await fetch(`${BASE_URL}/login`, { method: "GET" });
//   if (!response.ok) throw new Error("Login failed");
//   return response.json();
// }