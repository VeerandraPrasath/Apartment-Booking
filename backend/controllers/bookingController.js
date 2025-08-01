import pool from "../db.js";

//updated
export const getBookingHistory = async (req, res) => {
  const { city, status, role, search, checkIn, checkOut } = req.query;

  try {
    let query = `
      SELECT 
        r.id AS request_id,
        r.status,
        r.booking_type,
        r.timestamp AS requested_at,
        r.processed_at,
        c.name AS city,
        ru.id AS requester_id,
        ru.name AS requester_name,
        ru.email AS requester_email,
        ru.role AS requester_role,
        ru.gender AS requester_gender,
        
        bm.id AS member_id,
        bm.check_in,
        bm.check_out,
        mu.id AS member_user_id,
        mu.name AS member_name,
        mu.email AS member_email,

        aa.apartment_id, apt.name AS apartment_name,
        aa.flat_id, f.name AS flat_name,
        aa.room_id, ro.name AS room_name,
        aa.bed_id, b.name AS bed_name

      FROM requests r
      JOIN users ru ON ru.id = r.user_id
      JOIN cities c ON c.id = r.city_id
      JOIN booking_members bm ON bm.request_id = r.id
      JOIN users mu ON mu.id = bm.user_id
      LEFT JOIN assigned_accommodations aa ON aa.booking_members_id = bm.id
      LEFT JOIN apartments apt ON apt.id = aa.apartment_id
      LEFT JOIN flats f ON f.id = aa.flat_id
      LEFT JOIN rooms ro ON ro.id = aa.room_id
      LEFT JOIN beds b ON b.id = aa.bed_id
      WHERE 1=1
    `;

    const params = [];

    if (city) {
      query += ` AND r.city_id = $${params.length + 1}`;
      params.push(city);
    }

    if (status) {
      query += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }

    if (role) {
      query += ` AND ru.role = $${params.length + 1}`;
      params.push(role);
    }

    if (search) {
      query += ` AND (LOWER(ru.name) LIKE LOWER($${params.length + 1}) OR LOWER(ru.email) LIKE LOWER($${params.length + 1}))`;
      params.push(`%${search}%`);
    }

    if (checkIn && checkOut) {
      query += ` AND bm.check_in < $${params.length + 2} AND bm.check_out > $${params.length + 1}`;
      params.push(checkIn, checkOut);
    }

    query += ` ORDER BY r.timestamp DESC`;

    const { rows } = await pool.query(query, params);

    // Group by request
    const requestMap = new Map();

    for (const row of rows) {
      if (!requestMap.has(row.request_id)) {
        requestMap.set(row.request_id, {
          requestId: row.request_id,
          city: row.city,
          requestedBy: {
            id: row.requester_id,
            name: row.requester_name,
            email: row.requester_email,
            role: row.requester_role,
            gender: row.requester_gender,
          },
          status: row.status,
          bookingType: row.booking_type,
          processedAt: row.processed_at,
          requestedAt: row.requested_at,
          bookingMembers: [],
        });
      }

      const req = requestMap.get(row.request_id);
      req.bookingMembers.push({
        id: row.member_user_id,
        name: row.member_name,
        email: row.member_email,
        checkIn: row.check_in,
        checkOut: row.check_out,
        assignedAccommodation: {
          apartment: row.apartment_name,
          flat: row.flat_name,
          room: row.room_name,
          bed: row.bed_name,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: Array.from(requestMap.values()),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// updated
export const createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, cityId, bookingType, BookingMembers } = req.body;

    await client.query("BEGIN");

    // 1. Insert into requests table
    const requestRes = await client.query(
      `INSERT INTO requests (user_id, city_id, booking_type)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, cityId, bookingType]
    );

    const requestId = requestRes.rows[0].id;

    // 2. Insert each booking member into booking_members
    for (const member of BookingMembers) {
      const { userId: memberUserId, checkInTime, checkOutTime } = member;

      await client.query(
        `INSERT INTO booking_members (request_id, user_id, check_in, check_out)
         VALUES ($1, $2, $3, $4)`,
        [requestId, memberUserId, checkInTime, checkOutTime]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      requestId,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking error:", err);
    res.status(500).json({ success: false, error: "Failed to create booking request" });
  } finally {
    client.release();
  }
};

export const getUserUpcomingBookings = async (req, res) => {
  const { userId } = req.params;
  const currentDate = new Date().toISOString();

  try {
    const query = `
      SELECT 
        r.id AS request_id,
        r.booking_type,
        r.timestamp AS requested_at,
        c.name AS city_name,
        ru.id AS requester_id,
        ru.name AS requester_name,
        ru.email AS requester_email,
        ru.role AS requester_role,
        ru.gender AS requester_gender,
        bm.id AS member_id,
        bm.check_in,
        bm.check_out,
        mu.id AS member_user_id,
        mu.name AS member_name,
        mu.email AS member_email,
        mu.role AS member_role,
        mu.gender AS member_gender,
        aa.apartment_id,
        apt.name AS apartment_name,
        aa.flat_id,
        f.name AS flat_name,
        aa.room_id,
        ro.name AS room_name,
        aa.bed_id,
        b.name AS bed_name
      FROM requests r
      JOIN cities c ON c.id = r.city_id
      JOIN users ru ON ru.id = r.user_id
      JOIN booking_members bm ON bm.request_id = r.id
      JOIN users mu ON mu.id = bm.user_id
      LEFT JOIN assigned_accommodations aa ON aa.booking_members_id = bm.id
      LEFT JOIN apartments apt ON apt.id = aa.apartment_id
      LEFT JOIN flats f ON f.id = aa.flat_id
      LEFT JOIN rooms ro ON ro.id = aa.room_id
      LEFT JOIN beds b ON b.id = aa.bed_id
      WHERE r.status = 'approved'
        AND (r.user_id = $1 OR bm.user_id = $1)
        AND bm.check_in > $2
      ORDER BY bm.check_in ASC
    `;

    const { rows } = await pool.query(query, [userId, currentDate]);

    const bookingsMap = new Map();

    for (const row of rows) {
      if (!bookingsMap.has(row.request_id)) {
        bookingsMap.set(row.request_id, {
          requestId: row.request_id,
          cityName: row.city_name,
          bookingType: row.booking_type,
          requestedAt: row.requested_at,
          requestedUser: {
            id: row.requester_id,
            name: row.requester_name,
            email: row.requester_email,
            role: row.requester_role,
            gender: row.requester_gender
          },
          bookingMembers: []
        });
      }

      const booking = bookingsMap.get(row.request_id);
      
      // Only add if not the requesting user
      if (row.member_user_id !== parseInt(userId)) {
        booking.bookingMembers.push({
          userId: row.member_user_id,
          name: row.member_name,
          email: row.member_email,
          role: row.member_role,
          gender: row.member_gender,
          checkIn: row.check_in,
          checkOut: row.check_out,
          accommodation: {
            apartment: row.apartment_id ? { id: row.apartment_id, name: row.apartment_name } : null,
            flat: row.flat_id ? { id: row.flat_id, name: row.flat_name } : null,
            room: row.room_id ? { id: row.room_id, name: row.room_name } : null,
            bed: row.bed_id ? { id: row.bed_id, name: row.bed_name } : null
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: Array.from(bookingsMap.values())
    });

  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const cancelBooking = async (req, res) => {
  const { requestId, userId } = req.params;

  try {
    await pool.query('BEGIN');

    // 1. Get request details with FOR UPDATE lock
    const requestQuery = `
      SELECT id, booking_type 
      FROM requests 
      WHERE id = $1 AND status = 'approved'
      FOR UPDATE
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Approved booking not found'
      });
    }

    const request = requestResult.rows[0];

    // 2. Find the member's booking
    const memberQuery = `
      SELECT id FROM booking_members
      WHERE request_id = $1 AND user_id = $2
    `;
    const memberResult = await pool.query(memberQuery, [requestId, userId]);

    if (memberResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found in booking members'
      });
    }

    const memberId = memberResult.rows[0].id;

    // 3. Release accommodation
    await pool.query(
      'DELETE FROM assigned_accommodations WHERE booking_members_id = $1',
      [memberId]
    );

    // 4. Remove member
    await pool.query(
      'DELETE FROM booking_members WHERE id = $1',
      [memberId]
    );

    // 5. For individual bookings, cancel entire request
    if (request.booking_type === 'individual') {
      await pool.query(
        `UPDATE requests SET status = 'cancelled', processed_at = NOW() 
         WHERE id = $1`,
        [requestId]
      );
    } else {
      // For team bookings, check if any members remain
      const remainingResult = await pool.query(
        'SELECT COUNT(*) FROM booking_members WHERE request_id = $1',
        [requestId]
      );
      
      if (remainingResult.rows[0].count === '0') {
        await pool.query(
          `UPDATE requests SET status = 'cancelled', processed_at = NOW() 
           WHERE id = $1`,
          [requestId]
        );
      }
    }

    await pool.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const getUserBookingHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        r.id AS request_id,
        r.status,
        r.booking_type,
        r.timestamp AS requested_at,
        r.processed_at,
        c.id AS city_id,
        c.name AS city_name,
        ru.id AS requester_id,
        ru.name AS requester_name,
        ru.email AS requester_email,
        ru.role AS requester_role,
        ru.gender AS requester_gender,
        bm.id AS member_id,
        bm.check_in,
        bm.check_out,
        mu.id AS member_user_id,
        mu.name AS member_name,
        mu.email AS member_email,
        mu.role AS member_role,
        mu.gender AS member_gender,
        aa.apartment_id,
        apt.name AS apartment_name,
        aa.flat_id,
        f.name AS flat_name,
        aa.room_id,
        ro.name AS room_name,
        aa.bed_id,
        b.name AS bed_name
      FROM requests r
      JOIN cities c ON c.id = r.city_id
      JOIN users ru ON ru.id = r.user_id
      JOIN booking_members bm ON bm.request_id = r.id
      JOIN users mu ON mu.id = bm.user_id
      LEFT JOIN assigned_accommodations aa ON aa.booking_members_id = bm.id
      LEFT JOIN apartments apt ON apt.id = aa.apartment_id
      LEFT JOIN flats f ON f.id = aa.flat_id
      LEFT JOIN rooms ro ON ro.id = aa.room_id
      LEFT JOIN beds b ON b.id = aa.bed_id
      WHERE (r.user_id = $1 OR bm.user_id = $1)
        AND r.status IN ('approved', 'rejected', 'cancelled')
      ORDER BY r.timestamp DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    const historyMap = new Map();

    for (const row of rows) {
      if (!historyMap.has(row.request_id)) {
        historyMap.set(row.request_id, {
          requestId: row.request_id,
          status: row.status,
          processedAt: row.processed_at,
          city: { id: row.city_id, name: row.city_name },
          requestedAt: row.requested_at,
          bookingType: row.booking_type,
          requestedUser: {
            id: row.requester_id,
            name: row.requester_name,
            email: row.requester_email,
            role: row.requester_role,
            gender: row.requester_gender
          },
          bookingMembers: []
        });
      }

      const booking = historyMap.get(row.request_id);
      
      // Only add if not the requesting user
      if (row.member_user_id !== parseInt(userId)) {
        booking.bookingMembers.push({
          userId: row.member_user_id,
          name: row.member_name,
          email: row.member_email,
          role: row.member_role,
          gender: row.member_gender,
          checkIn: row.check_in,
          checkOut: row.check_out,
          accommodation: {
            apartment: row.apartment_id ? { id: row.apartment_id, name: row.apartment_name } : null,
            flat: row.flat_id ? { id: row.flat_id, name: row.flat_name } : null,
            room: row.room_id ? { id: row.room_id, name: row.room_name } : null,
            bed: row.bed_id ? { id: row.bed_id, name: row.bed_name } : null
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: Array.from(historyMap.values())
    });

  } catch (error) {
    console.error('Error fetching booking history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// export const createBooking = async (req, res) => {
//   const {
//     user,            // { id, name, email, role }
//     city,            // city name
//     dates,           // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
//     checkInTime,     // 'HH:mm'
//     checkOutTime,    // 'HH:mm'
//     bookingType,
//     bookingFor,     // 'individual' or 'team'
//     remarks = null,
//     teamMembers = [] // array of emails (only if bookingType is team)
//   } = req.body;

//   try {
//     // Combine date and time strings manually
//     const checkIn = `${dates.from} ${checkInTime}`;     // e.g., '2025-07-20 08:00'
//     const checkOut = `${dates.to} ${checkOutTime}`;     // e.g., '2025-07-24 10:00'

//     const fromDate = new Date(dates.from);
//     const toDate = new Date(dates.to);

//     const durationInDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);

//     if (durationInDays > 14) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error: Maximum stay is 14 days.'
//       });
//     }

//     // 1. Fetch city_id
//     const cityResult = await pool.query(
//       'SELECT id FROM cities WHERE LOWER(name) = LOWER($1)',
//       [city]
//     );
//     if (cityResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'City not found.'
//       });
//     }

//     const cityId = cityResult.rows[0].id;

//     // 2. Insert into requests
//     const insertRequest = await pool.query(
//       `INSERT INTO requests (
//          user_id, city_id, booking_type, remarks,
//          date_from, date_to, check_in, check_out,booking_for
//        ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamp, $8::timestamp,$9)
//        RETURNING id`,
//       [
//         user.id,
//         cityId,
//         bookingType,
//         remarks,
//         dates.from,
//         dates.to,
//         checkIn,
//         checkOut,
//         bookingFor
//       ]
//     );

//     const requestId = insertRequest.rows[0].id;

//     // 3. If team booking, insert members
//     if (bookingType === 'team' && teamMembers.length > 0) {
//       const memberInsertPromises = teamMembers.map(email =>
//         pool.query(
//           'INSERT INTO team_members (request_id, email) VALUES ($1, $2)',
//           [requestId, email]
//         )
//       );
//       await Promise.all(memberInsertPromises);
//     }

//     res.json({
//       success: true,
//       message: 'Booking request submitted successfully.',
//       requestId
//     });

//   } catch (err) {
//     console.error('Booking request error:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error.'
//     });
//   }
// };
