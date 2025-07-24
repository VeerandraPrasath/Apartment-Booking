// controllers/citiesController.js
import pool from '../db.js';
import dayjs from 'dayjs';

export const getAllCities = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

export const createCity = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "City name is required." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO cities (name) VALUES ($1) RETURNING id, name",
      [name.trim()]
    );

    res.status(201).json({
      success: true,
      city: result.rows[0]
    });
  } catch (error) {
    console.error("Error inserting city:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const EditCity = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "City name is required." });
  }

  try {
    const result = await pool.query(
      "UPDATE cities SET name = $1 WHERE id = $2 RETURNING id, name",
      [name.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    res.json({ success: true, city: result.rows[0] });
  } catch (error) {
    console.error("Error updating city:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export const deleteCity=async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM cities WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


export const getAvailabilityByCityId = async (req, res) => {
  const cityId = req.params.cityId;
  const { fromDate, toDate } = req.body;
  console.log("City ID:", cityId, "From Date:", fromDate, "To Date:", toDate);

  try {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Get all accommodations that overlap the requested dates
    const overlappingAssignments = await pool.query(
      `SELECT flat_id, room_id, bed_id 
       FROM assigned_accommodations 
       WHERE city_id = $1 AND (
         (check_in, check_out) OVERLAPS ($2::timestamp, $3::timestamp)
       )`,
      [cityId, from, to]
    );

    // Create sets of booked IDs
    const bookedFlats = new Set();
    const bookedRooms = new Set();
    const bookedBeds = new Set();

    overlappingAssignments.rows.forEach(acc => {
      if (acc.bed_id) {
        bookedBeds.add(acc.bed_id);
      } else if (acc.room_id) {
        bookedRooms.add(acc.room_id);
      } else if (acc.flat_id) {
        bookedFlats.add(acc.flat_id);
      }
    });

    // Get full apartment-structure for this city
    const apartments = await pool.query(
      `SELECT 
        a.id AS apartment_id, 
        a.name AS apartment_name, 
        a.google_map_link,
        f.id AS flat_id, 
        f.name AS flat_name,
        r.id AS room_id, 
        r.name AS room_name,
        b.id AS bed_id, 
        b.name AS bed_name
      FROM apartments a
      JOIN flats f ON a.id = f.apartment_id
      LEFT JOIN rooms r ON f.id = r.flat_id
      LEFT JOIN beds b ON r.id = b.room_id
      WHERE a.city_id = $1
      ORDER BY a.id, f.id, r.id, b.id`,
      [cityId]
    );

    // Build structure
    const result = {};

    for (const row of apartments.rows) {
      if (!result[row.apartment_id]) {
        result[row.apartment_id] = {
          id: row.apartment_id,
          name: row.apartment_name,
          google_map_link: row.google_map_link,
          flats: {}
        };
      }

      if (!result[row.apartment_id].flats[row.flat_id]) {
        result[row.apartment_id].flats[row.flat_id] = {
          id: row.flat_id,
          name: row.flat_name,
          is_booked: bookedFlats.has(row.flat_id),
          rooms: {}
        };
      }

     if (row.room_id && !result[row.apartment_id].flats[row.flat_id].rooms[row.room_id]) {
  result[row.apartment_id].flats[row.flat_id].rooms[row.room_id] = {
    id: row.room_id,
    name: row.room_name,
    is_booked: bookedRooms.has(row.room_id),
    beds: {} // ← updated from cottages
  };
}

if (row.bed_id && row.room_id && result[row.apartment_id].flats[row.flat_id].rooms[row.room_id]) {
  result[row.apartment_id].flats[row.flat_id].rooms[row.room_id].beds[row.bed_id] = {
    id: row.bed_id,
    name: row.bed_name,
    is_booked: bookedBeds.has(row.bed_id)
  };
}

    }

    // Convert nested objects to arrays
    const structuredResult = Object.values(result).map(apartment => ({
      ...apartment,
      flats: Object.values(apartment.flats).map(flat => ({
        ...flat,
        rooms: Object.values(flat.rooms).map(room => ({
          ...room,
        beds: Object.values(room.beds)
        }))
      }))
    }));

    res.json({
      success: true,
      apartments: structuredResult
    });

  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
};




// export const getAvailabilityByCityId = async (req, res) => {
//   const cityId = req.params.cityId;
//   const { fromDate, toDate } = req.body;
//   console.log("City ID:", cityId, "From Date:", fromDate, "To Date:", toDate);

//   try {
//     const from = new Date(fromDate);
//     const to = new Date(toDate);

//     // Get all approved requests that overlap with the requested dates
//     const overlappingRequests = await pool.query(
//       `SELECT id FROM requests 
//        WHERE city_id = $1 AND status = 'approved'
//        AND ((check_in, check_out) OVERLAPS ($2::date, $3::date))`,
//       [cityId, from, to]
//     );

//     const requestIds = overlappingRequests.rows.map(r => r.id);

//     // Get all assigned accommodations for these requests
//     const assignedAccommodations = await pool.query(
//       `SELECT 
//          flat_id, 
//          room_id, 
//          bed_id 
//        FROM assigned_accommodations 
//        WHERE request_id = ANY($1::int[])`,
//       [requestIds.length ? requestIds : [0]] // Use [0] when empty to avoid SQL error
//     );

//     // Create sets of booked IDs for quick lookup
//     const bookedFlats = new Set();
//     const bookedRooms = new Set();
//     const bookedBeds = new Set();

//     assignedAccommodations.rows.forEach(acc => {
//       if (acc.bed_id) {
//         bookedBeds.add(acc.bed_id);
//       } else if (acc.room_id) {
//         bookedRooms.add(acc.room_id);
//       } else if (acc.flat_id) {
//         bookedFlats.add(acc.flat_id);
//       }
//     });

//     // Get the complete apartment structure for the city
//     const apartments = await pool.query(
//       `SELECT 
//         a.id AS apartment_id, 
//         a.name AS apartment_name, 
//         a.google_map_link,
//         f.id AS flat_id, 
//         f.name AS flat_name,
//         r.id AS room_id, 
//         r.name AS room_name,
//         b.id AS bed_id, 
//         b.name AS bed_name
//       FROM apartments a
//       JOIN flats f ON a.id = f.apartment_id
//       LEFT JOIN rooms r ON f.id = r.flat_id
//       LEFT JOIN beds b ON r.id = b.room_id
//       WHERE a.city_id = $1
//       ORDER BY a.id, f.id, r.id, b.id`,
//       [cityId]
//     );

//     // Build the hierarchical structure with booking status
//     const result = {};

//     for (const row of apartments.rows) {
//       // Initialize apartment if not exists
//       if (!result[row.apartment_id]) {
//         result[row.apartment_id] = {
//           id: row.apartment_id,
//           name: row.apartment_name,
//           google_map_link: row.google_map_link,
//           flats: {}
//         };
//       }

//       // Initialize flat if not exists
//       if (!result[row.apartment_id].flats[row.flat_id]) {
//         result[row.apartment_id].flats[row.flat_id] = {
//           id: row.flat_id,
//           name: row.flat_name,
//           is_booked: bookedFlats.has(row.flat_id),
//           rooms: {}
//         };
//       }

//       // Process room if exists
//       if (row.room_id && !result[row.apartment_id].flats[row.flat_id].rooms[row.room_id]) {
//         result[row.apartment_id].flats[row.flat_id].rooms[row.room_id] = {
//           id: row.room_id,
//           name: row.room_name,
//           is_booked: bookedRooms.has(row.room_id),
//           cottages: {}
//         };
//       }

//       // Process bed (cottage) if exists
//       if (row.bed_id && row.room_id && result[row.apartment_id].flats[row.flat_id].rooms[row.room_id]) {
//         result[row.apartment_id].flats[row.flat_id].rooms[row.room_id].cottages[row.bed_id] = {
//           id: row.bed_id,
//           name: row.bed_name,
//           is_booked: bookedBeds.has(row.bed_id)
//         };
//       }
//     }

//     // Convert the nested objects to arrays for the response
//     const structuredResult = Object.values(result).map(apartment => ({
//       ...apartment,
//       flats: Object.values(apartment.flats).map(flat => ({
//         ...flat,
//         rooms: Object.values(flat.rooms).map(room => ({
//           ...room,
//           cottages: Object.values(room.cottages)
//         }))
//       }))
//     }));

//     res.json({
//       success: true,
//       apartments: structuredResult
//     });

//   } catch (err) {
//     console.error("Error fetching availability:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error."
//     });
//   }
// };




export const getAvailabilityByCityIdWork = async (req, res) => {
  const cityId = req.params.cityId;

  try {
    const apartmentsRes = await pool.query(`
      SELECT 
        a.id AS apartment_id, 
        a.name AS apartment_name, 
        a.google_map_link,

        f.id AS flat_id, 
        f.name AS flat_name,
        f.is_booked AS flat_booked,

        r.id AS room_id, 
        r.name AS room_name,
        r.is_booked AS room_booked,

        b.id AS bed_id, 
        b.name AS bed_name,
        b.is_booked AS bed_booked

      FROM apartments a
      LEFT JOIN flats f ON f.apartment_id = a.id
      LEFT JOIN rooms r ON r.flat_id = f.id
      LEFT JOIN beds b ON b.room_id = r.id
      WHERE a.city_id = $1
      ORDER BY a.id, f.id, r.id, b.id
    `, [cityId]);

    const rows = apartmentsRes.rows;
    const apartmentsMap = {};

    for (const row of rows) {
      const aptId = row.apartment_id;
      if (!apartmentsMap[aptId]) {
        apartmentsMap[aptId] = {
          id: aptId,
          name: row.apartment_name,
          google_map_link: row.google_map_link,
          flats: []
        };
      }

      const apartment = apartmentsMap[aptId];

      let flat = apartment.flats.find(f => f.id === row.flat_id);
      if (!flat && row.flat_id) {
        flat = {
          id: row.flat_id,
          name: row.flat_name,
          is_booked: row.flat_booked ?? false,
          rooms: []
        };
        apartment.flats.push(flat);
      }

      if (flat && row.room_id) {
        let room = flat.rooms.find(r => r.id === row.room_id);
        if (!room) {
          room = {
            id: row.room_id,
            name: row.room_name,
            is_booked: row.room_booked ?? false,
            cottages: []
          };
          flat.rooms.push(room);
        }

        if (row.bed_id) {
          room.cottages.push({
            id: row.bed_id,
            name: row.bed_name,
            is_booked: row.bed_booked ?? false
          });
        }
      }
    }

    res.json({
      success: true,
      apartments: Object.values(apartmentsMap)
    });
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


