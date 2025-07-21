
import pool from '../db.js';
import dayjs from 'dayjs';

export const getAvailabilityByCityId = async (req, res) => {
  const cityId = req.params.id;
  const fromDate = dayjs(req.body.from);
  const toDate = dayjs(req.body.to);

  try {
    // 1. Validate city
    const cityResult = await pool.query('SELECT * FROM cities WHERE id = $1', [cityId]);
    if (cityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }
    const cityName = cityResult.rows[0].name;

    // 2. Get conflicting approved requests
    const requestsResult = await pool.query(
      `SELECT id FROM requests 
       WHERE city_id = $1 
         AND status = 'approved'
         AND date_from <= $2 
         AND date_to >= $1`,
      [cityId, toDate.toDate(), fromDate.toDate()]
    );
    const conflictingRequestIds = requestsResult.rows.map(r => r.id);

    // 3. Get assigned accommodations for those requests
    let assignedFlats = new Set();
    let assignedRooms = new Set();
    let assignedBeds = new Set();

    if (conflictingRequestIds.length > 0) {
      const placeholders = conflictingRequestIds.map((_, i) => `$${i + 1}`).join(',');
      const assignedResult = await pool.query(
        `SELECT flat_id, room_id, bed_id 
         FROM assigned_accommodations 
         WHERE request_id IN (${placeholders})`,
        conflictingRequestIds
      );

      for (const row of assignedResult.rows) {
        if (row.bed_id) {
          assignedBeds.add(row.bed_id);
        } else if (row.room_id) {
          assignedRooms.add(row.room_id);
        } else if (row.flat_id) {
          assignedFlats.add(row.flat_id);
        }
      }
    }

    // 4. Get apartments
    const apartmentsRes = await pool.query(
      `SELECT * FROM apartments WHERE city_id = $1`,
      [cityId]
    );
    const apartments = apartmentsRes.rows;

    const responseApartments = [];

    for (const apt of apartments) {
      const flatRes = await pool.query(`SELECT * FROM flats WHERE apartment_id = $1`, [apt.id]);
      const flats = [];

      for (const flat of flatRes.rows) {
        const roomRes = await pool.query(`SELECT * FROM rooms WHERE flat_id = $1`, [flat.id]);
        const rooms = [];

        for (const room of roomRes.rows) {
          const bedRes = await pool.query(`SELECT * FROM beds WHERE room_id = $1`, [room.id]);
          const cottages = bedRes.rows.map(bed => ({
            id: bed.id,
            name: bed.name,
            is_booked: assignedBeds.has(bed.id)
          }));

          rooms.push({
            id: room.id,
            name: room.name,
            is_booked: assignedRooms.has(room.id),
            cottages
          });
        }

        flats.push({
          id: flat.id,
          name: flat.name,
          is_booked: assignedFlats.has(flat.id),
          rooms
        });
      }

      responseApartments.push({
        id: apt.id,
        name: apt.name,
        google_map_link: apt.google_map_link,
        flats
      });
    }

    res.json({ success: true, apartments: responseApartments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


// export const getAvailabilityByCityId = async (req, res) => {
//   const cityId = req.params.id;
//   const fromDate = dayjs(req.body.from);
//   const toDate = dayjs(req.body.to);
//   try {
//     // Reset outdated bookings
//     await pool.query(`
//       UPDATE flats SET isbooked = false WHERE upto < NOW();
//       UPDATE rooms SET isbooked = false WHERE upto < NOW();
//       UPDATE beds SET isbooked = false WHERE upto < NOW();
//     `);

//     const cityResult = await pool.query('SELECT * FROM cities WHERE id = $1', [cityId]);
//     if (cityResult.rows.length === 0) {
//       return res.status(404).json({ error: 'City not found' });
//     }

//     const cityName = cityResult.rows[0].name;

//     const apartmentsRes = await pool.query(
//       `SELECT * FROM apartments WHERE city_id = $1`,
//       [cityId]
//     );
//     const apartments = apartmentsRes.rows;

//     const availableApartments = [];
//     const flatsByApartment = {};
//     const roomsByApartmentFlat = {};
//     const cottagesByApartmentFlatRoom = {};

//     for (const apt of apartments) {
//       const flatsRes = await pool.query(
//         'SELECT * FROM flats WHERE apartment_id = $1 AND (isbooked = false OR upto < NOW())',
//         [apt.id]
//       );
//       const flats = flatsRes.rows;
//       if (flats.length === 0) continue; // Apartment is unavailable if no available flats

//       let apartmentHasAvailableUnit = false;
//       const flatList = [];
//       const roomMap = {};
//       const cottageMap = {};

//       for (const flat of flats) {
//         const flatId = flat.id;
//         flatList.push({ id: flatId, doorNumber: flat.name, status: 'available' });

//         const roomsRes = await pool.query(
//           'SELECT * FROM rooms WHERE flat_id = $1 AND (isbooked = false OR upto < NOW())',
//           [flatId]
//         );
//         const rooms = roomsRes.rows;

//         roomMap[flatId] = [];
//         cottageMap[flatId] = {};

//         for (const room of rooms) {
//           roomMap[flatId].push({ id: room.id, name: room.name, status: 'available' });

//           const cottagesRes = await pool.query(
//             'SELECT * FROM cottages WHERE room_id = $1 AND (isbooked = false OR upto < NOW())',
//             [room.id]
//           );
//           const cottages = cottagesRes.rows;

//           cottageMap[flatId][room.id] = cottages.map(c => ({
//             id: c.id,
//             name: c.name,
//             status: 'available'
//           }));

//           if (cottages.length > 0) apartmentHasAvailableUnit = true;
//         }
//         if (rooms.length > 0) apartmentHasAvailableUnit = true;
//       }

//       if (apartmentHasAvailableUnit) {
//         availableApartments.push({
//           id: apt.id,
//           name: apt.name,
//           city: cityName,
//           googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(apt.name + ' ' + cityName)}`
//         });
//         flatsByApartment[apt.id] = flatList;
//         roomsByApartmentFlat[apt.id] = roomMap;
//         cottagesByApartmentFlatRoom[apt.id] = cottageMap;
//       }
//     }

//     res.json({
//       [cityName.toLowerCase()]: {
//         apartments: availableApartments,
//         flats: flatsByApartment,
//         rooms: roomsByApartmentFlat,
//         cottages: cottagesByApartmentFlatRoom
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };