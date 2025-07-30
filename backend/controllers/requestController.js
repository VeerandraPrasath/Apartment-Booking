// controllers/bookingsController.js
import pool from '../db.js';
import db from '../db.js';
import dayjs from 'dayjs';
// controllers/bookingsController.js
import { Parser } from 'json2csv'; // for CSV export

export const getUserRequests = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        r.id AS request_id,
        r.status,
        r.booking_type,
        r.timestamp AS requested_at,
        c.name AS city_name,
        
        -- Requester info
        ru.id AS requester_id,
        ru.name AS requester_name,
        ru.email AS requester_email,
        ru.role AS requester_role,
        ru.gender AS requester_gender,
        
        -- Booking member info
        bm.id AS member_id,
        bm.check_in,
        bm.check_out,
        mu.id AS member_user_id,
        mu.name AS member_name,
        mu.email AS member_email,
        mu.role AS member_role,
        mu.gender AS member_gender
        
      FROM requests r
      JOIN cities c ON c.id = r.city_id
      JOIN users ru ON ru.id = r.user_id
      JOIN booking_members bm ON bm.request_id = r.id
      JOIN users mu ON mu.id = bm.user_id
      WHERE r.status = 'pending'
        AND (r.user_id = $1 OR bm.user_id = $1)
      ORDER BY r.timestamp DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    // Group by request
    const requestMap = new Map();

    for (const row of rows) {
      if (!requestMap.has(row.request_id)) {
        requestMap.set(row.request_id, {
          requestId: row.request_id,
          cityName: row.city_name,
          bookingType: row.booking_type,
          requestedAt: row.requested_at,
          requestedUser: {
            id: row.requester_id,
            name: row.requester_name,
            mail: row.requester_email,
            role: row.requester_role,
            gender: row.requester_gender
          },
          bookingMembers: []
        });
      }

      const request = requestMap.get(row.request_id);
      request.bookingMembers.push({
        userId: row.member_user_id,
        username: row.member_name,
        role: row.member_role,
        gender: row.member_gender,
        mail: row.member_email,
        checkIn: row.check_in,
        checkOut: row.check_out
      });
    }

    return res.status(200).json({
      success: true,
      data: Array.from(requestMap.values())
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};




export const getAllPendingRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id AS request_id,
        r.status,
        r.booking_type,
        r.processed_at,
        r.timestamp AS requested_at,

        c.name AS city_name,

        u.id AS requested_user_id,
        u.name AS requested_user_name,
        u.email AS requested_user_email,
        u.role AS requested_user_role,
        u.gender AS requested_user_gender,

        bm.id AS booking_member_id,
        bm.check_in,
        bm.check_out,

        mu.name AS member_name,
        mu.email AS member_email,
        mu.gender AS member_gender

      FROM requests r
      JOIN cities c ON r.city_id = c.id
      JOIN users u ON r.user_id = u.id
      JOIN booking_members bm ON bm.request_id = r.id
      JOIN users mu ON mu.id = bm.user_id
      WHERE r.status = 'pending'
      ORDER BY r.id;
    `);

    const rows = result.rows;

    const groupedRequests = {};

    for (const row of rows) {
      const requestId = row.request_id;

      if (!groupedRequests[requestId]) {
        groupedRequests[requestId] = {
          requestId: requestId,
          city: row.city_name,
          requestedBy: {
            userId: row.requested_user_id,
            name: row.requested_user_name,
            email: row.requested_user_email,
            role: row.requested_user_role,
            gender: row.requested_user_gender
          },
          status: row.status,
          bookingType: row.booking_type,
          requestedAt: row.requested_at,
          bookingMembers: []
        };
      }

      groupedRequests[requestId].bookingMembers.push({
        bookingMemberId: row.booking_member_id,
        name: row.member_name,
        email: row.member_email,
        gender: row.member_gender,
        checkIn: row.check_in,
        checkOut: row.check_out
      });
    }

    const finalData = Object.values(groupedRequests);

    res.status(200).json({
      success: true,
      data: finalData
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const approveRequest = async (req, res) => {
  const requestId = parseInt(req.params.id);
  const {
    assignedAccommodations = [],
    remarks
  } = req.body;

  console.log(assignedAccommodations);

  try {
    // Step 1: Fetch the request
    const requestRes = await db.query(
      `SELECT * FROM requests WHERE id = $1`,
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = requestRes.rows[0];
    
    // Step 2: Mark each accommodation as booked and insert assignment
    for (const member of assignedAccommodations) {
    

      // Insert into assigned_accommodations
      await db.query(
        `INSERT INTO assigned_accommodations
          (request_id, user_email, city_id, apartment_id, flat_id, room_id, bed_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          requestId,
          member.email,
          request.city_id,
          member.apartment_id || null,
          member.flat_id || null,
          member.room_id || null,
          member.bed_id || null
        ]
      );
    }

    // Step 3: Update request status only
    const processedAt = new Date();
    await db.query(
      `UPDATE requests
       SET status = 'approved', remarks = $1, processed_at = $2
       WHERE id = $3`,
      [remarks, processedAt, requestId]
    );

    // Step 4: Final response
    return res.status(200).json({
      success: true,
      message: "Request approved.",
      request: {
        id: requestId,
        status: "approved",
        assignedAccommodations,
        remarks,
        processedAt
      }
    });

  } catch (error) {
    console.error("Error approving request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while approving the request"
    });
  }
};


export const rejectRequest = async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { remarks, assigned_by } = req.body; // assigned_by is optional and unused here
  
  try {
    // Update the request status and remarks
    const result = await pool.query(
      `
      UPDATE requests
      SET status = 'rejected',
          remarks = $1,
          processed_at = NOW()
      WHERE id = $2
      RETURNING id, status, remarks
      `,
      [remarks || null, requestId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const rejectedRequest = result.rows[0];
    
    res.status(200).json({
      success: true,
      message: 'Request rejected.',
      request: {
        id: rejectedRequest.id,
        status: rejectedRequest.status,
        remarks: rejectedRequest.remarks
      }
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message
    });
  }
};

export const exportBookingHistory = async (req, res) => {
  const {
    city,
    status,
    role,
    search,
    dateFrom,
    dateTo
  } = req.body.filters || {};

  try {
    const params = [];
    const conditions = [];

    if (city) {
      conditions.push(`LOWER(ci.name) = LOWER($${params.length + 1})`);
      params.push(city);
    }

    if (status) {
      conditions.push(`r.status = $${params.length + 1}`);
      params.push(status.toLowerCase());
    }

    if (role) {
      conditions.push(`LOWER(u.role) = LOWER($${params.length + 1})`);
      params.push(role.toLowerCase());
    }

    if (search) {
      conditions.push(`(LOWER(u.name) LIKE LOWER($${params.length + 1}) OR LOWER(u.email) LIKE LOWER($${params.length + 1}))`);
      params.push(`%${search}%`);
    }

    if (dateFrom) {
      conditions.push(`r.date_from >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`r.date_to <= $${params.length + 1}`);
      params.push(dateTo);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        r.id AS request_id,
        r.date_from,
        r.date_to,
        r.status,
        r.booking_type,
        r.remarks,
        r.processed_at,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        ci.name AS city_name,
        a.name AS apartment_name,
        f.name AS flat_name,
        ro.name AS room_name,
        b.name AS bed_name,
        r.timestamp,
        ac.user_email AS assigned_email,
        (
          SELECT ARRAY_AGG(tm.email)
          FROM team_members tm
          WHERE tm.request_id = r.id
        ) AS team_members
      FROM requests r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN cities ci ON ci.id = r.city_id
      LEFT JOIN assigned_accommodations ac ON ac.request_id = r.id AND ac.user_email = u.email
      LEFT JOIN apartments a ON a.id = ac.apartment_id
      LEFT JOIN flats f ON f.id = ac.flat_id
      LEFT JOIN rooms ro ON ro.id = ac.room_id
      LEFT JOIN beds b ON b.id = ac.bed_id
      ${whereClause}
      ORDER BY r.timestamp DESC
    `;

    const result = await pool.query(query, params);

    const rows = result.rows.map(row => ({
      "User Name": row.user_name,
      "User Email": row.user_email,
      "Role": row.user_role,
      "City": row.city_name,
      "Accommodation": formatAssignment({
        apartment_name: row.apartment_name,
        flat_name: row.flat_name,
        room_name: row.room_name,
        bed_name: row.bed_name
      }),
      "Booking Type": row.booking_type,
      "Team Members": (row.team_members || []).join(', '),
      "Start Date": row.date_from?.toISOString().split('T')[0],
      "End Date": row.date_to?.toISOString().split('T')[0],
      "Status": row.status,
      "Remarks": row.remarks,
      "Processed At": row.processed_at?.toISOString() || '',
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    const filename = `booking_history_${Date.now()}.csv`;
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csv);

  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ success: false, message: 'Failed to export booking history' });
  }
};

// helper to format location string
function formatAssignment(row) {
  return [row.apartment_name, row.flat_name, row.room_name, row.cottage_name]
    .filter(Boolean).join(' > ');
}

// export const getBookingHistory = async (req, res) => {
//   const {
//     city,
//     status,
//     role,
//     search,
//     dateFrom,
//     dateTo
//   } = req.query;

//   try {
//     const params = [];
//     const conditions = [];

//     if (city) {
//       conditions.push(`LOWER(ci.name) = LOWER($${params.length + 1})`);
//       params.push(city);
//     }

//     if (status) {
//       conditions.push(`r.status = $${params.length + 1}`);
//       params.push(status.toLowerCase());
//     }

//     if (role) {
//       conditions.push(`LOWER(u.role) = LOWER($${params.length + 1})`);
//       params.push(role);
//     }

//     if (search) {
//       conditions.push(`(LOWER(u.name) LIKE LOWER($${params.length + 1}) OR LOWER(u.email) LIKE LOWER($${params.length + 1}))`);
//       params.push(`%${search}%`);
//     }

//     if (dateFrom) {
//       conditions.push(`r.date_from >= $${params.length + 1}`);
//       params.push(dateFrom);
//     }

//     if (dateTo) {
//       conditions.push(`r.date_to <= $${params.length + 1}`);
//       params.push(dateTo);
//     }

//     const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

//     const query = `
//       SELECT
//         r.id,
//         r.date_from,
//         r.date_to,
//         r.status,
//         r.remarks,
//         r.booking_type,
//         r.timestamp,
//         r.processed_at,
//         u.id AS user_id,
//         u.name AS user_name,
//         u.email AS user_email,
//         u.role AS user_role,
//         ci.name AS city_name,
//         aa.apartment_id,
//         a.name AS apartment_name,
//         f.name AS flat_name,
//         r1.name AS room_name,
//         b.name AS bed_name,
//         aa.user_email AS assigned_email
//       FROM requests r
//       LEFT JOIN users u ON u.id = r.user_id
//       LEFT JOIN cities ci ON ci.id = r.city_id
//       LEFT JOIN assigned_accommodations aa ON aa.request_id = r.id
//       LEFT JOIN apartments a ON a.id = aa.apartment_id
//       LEFT JOIN flats f ON f.id = aa.flat_id
//       LEFT JOIN rooms r1 ON r1.id = aa.room_id
//       LEFT JOIN beds b ON b.id = aa.bed_id
//       ${whereClause}
//       ORDER BY r.processed_at DESC NULLS LAST, r.timestamp DESC
//     `;

//     const result = await pool.query(query, params);

//     const requestsMap = {};

//     for (const row of result.rows) {
//       if (!requestsMap[row.id]) {
//         requestsMap[row.id] = {
//           id: row.id,
//           timestamp: row.timestamp,
//           user: {
//             id: row.user_id,
//             name: row.user_name,
//             email: row.user_email,
//             role: row.user_role
//           },
//           city: row.city_name,
//           dates: {
//             from: row.date_from.toISOString().split('T')[0],
//             to: row.date_to.toISOString().split('T')[0]
//           },
//           status: row.status,
//           assignedAccommodations: {},
//           bookingType: row.booking_type,
//           teamMembers: [],
//           remarks: row.remarks,
//           processedAt: row.processed_at
//         };
//       }

//       const accommodation = {
//         apartment: row.apartment_name,
//         flat: row.flat_name,
//         room: row.room_name,
//         bed: row.bed_name // updated field
//       };

//       if (row.assigned_email) {
//         requestsMap[row.id].assignedAccommodations[row.assigned_email] = accommodation;

//         if (
//           row.assigned_email !== row.user_email &&
//           !requestsMap[row.id].teamMembers.includes(row.assigned_email)
//         ) {
//           requestsMap[row.id].teamMembers.push(row.assigned_email);
//         }
//       }
//     }

//     const requests = Object.values(requestsMap);

//     res.json({
//       success: true,
//       requests
//     });

//   } catch (err) {
//     console.error('Booking History Error:', err);
//     res.status(500).json({ success: false, message: 'Server error.' });
//   }
// };