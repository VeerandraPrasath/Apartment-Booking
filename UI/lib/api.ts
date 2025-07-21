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
    console.log("Fetched hierarchy:", data.hierarchy)
    return data.hierarchy
  }
  throw new Error(data.message || "No hierarchy data found")
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