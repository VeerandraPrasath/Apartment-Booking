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
      
      // Only add if not the requesting user
      if (row.member_user_id !== parseInt(userId)) {
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

export const cancelRequest = async (req, res) => {
  const { requestId, userId } = req.params;

  try {
    // First, get the request details
    const requestQuery = `
      SELECT r.id, r.booking_type, r.user_id as requester_id
      FROM requests r
      WHERE r.id = $1 AND r.status = 'pending'
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    const request = requestResult.rows[0];
    const isRequester = request.requester_id === parseInt(userId);

    if (request.booking_type === 'individual') {
      // For individual requests - delete the entire request if user is the requester
      if (!isRequester) {
        return res.status(403).json({
          success: false,
          message: 'Only the requester can cancel an individual booking'
        });
      }

      await pool.query('DELETE FROM requests WHERE id = $1', [requestId]);
      
      return res.status(200).json({
        success: true,
        message: 'Individual request cancelled successfully'
      });
    } else {
      // For team requests
      if (isRequester) {
        // If requester is cancelling - delete the entire request
        await pool.query('DELETE FROM requests WHERE id = $1', [requestId]);
        
        return res.status(200).json({
          success: true,
          message: 'Team request cancelled successfully by requester'
        });
      } else {
        // If team member is cancelling - just remove them from booking_members
        const deleteMemberQuery = `
          DELETE FROM booking_members
          WHERE request_id = $1 AND user_id = $2
          RETURNING id
        `;
        const deleteResult = await pool.query(deleteMemberQuery, [requestId, userId]);

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found in booking members'
          });
        }

        // Check if there are any members left
        const membersLeftQuery = `
          SELECT COUNT(*) FROM booking_members
          WHERE request_id = $1
        `;
        const membersLeftResult = await pool.query(membersLeftQuery, [requestId]);

        if (membersLeftResult.rows[0].count === '0') {
          // If no members left, delete the entire request
          await pool.query('DELETE FROM requests WHERE id = $1', [requestId]);
        }

        return res.status(200).json({
          success: true,
          message: 'Removed from team booking successfully'
        });
      }
    }
  } catch (error) {
    console.error('Error cancelling request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};









export const approveRequest = async (req, res) => {
  const requestId = parseInt(req.params.requestId);
  const { allocatedAccommodation = [] } = req.body;

  if (!requestId || !Array.isArray(allocatedAccommodation)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid request parameters' 
    });
  }

  const client = await db.connect(); // Get a DB client for transactions

  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Validate and lock the request
    const requestRes = await client.query(
      `SELECT id, city_id, status 
       FROM requests 
       WHERE id = $1 
       FOR UPDATE`, // Lock row for update
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    const request = requestRes.rows[0];
    
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        message: 'Request already processed' 
      });
    }

    // 2. Validate all booking members belong to this request
    const bookingMemberIds = allocatedAccommodation.map(a => a.bookingMemberId);
    const membersRes = await client.query(
      `SELECT id FROM booking_members 
       WHERE id = ANY($1::int[]) 
       AND request_id = $2`,
      [bookingMemberIds, requestId]
    );

    if (membersRes.rows.length !== allocatedAccommodation.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking member assignments' 
      });
    }

    // 3. Process accommodations
    for (const allocation of allocatedAccommodation) {
      const { bookingMemberId, assignedAccommodation } = allocation;
      const { apartmentId, flatId, roomId, bedId } = assignedAccommodation;

      // Validate accommodation hierarchy
      if (bedId && !roomId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Bed assignment requires room ID' 
        });
      }

      if (roomId && !flatId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Room assignment requires flat ID' 
        });
      }

      // Check accommodation availability
      const conflictCheck = await client.query(
        `SELECT 1 FROM assigned_accommodations
         WHERE (apartment_id = $1 OR flat_id = $2 OR room_id = $3 OR bed_id = $4)
         AND booking_members_id IN (
           SELECT id FROM booking_members 
           WHERE request_id != $5
         )`,
        [apartmentId, flatId, roomId, bedId, requestId]
      );

      if (conflictCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          success: false, 
          message: 'Accommodation already assigned to another request' 
        });
      }

      // Insert assignment
      await client.query(
        `INSERT INTO assigned_accommodations (
          booking_members_id,
          city_id,
          apartment_id,
          flat_id,
          room_id,
          bed_id
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          bookingMemberId,
          request.city_id,
          apartmentId || null,
          flatId || null,
          roomId || null,
          bedId || null
        ]
      );
    }

    // 4. Update request status
    const processedAt = new Date();
    await client.query(
      `UPDATE requests
       SET status = 'approved', 
           processed_at = $1,
           remarks = $2
       WHERE id = $3`,
      [processedAt, req.body.remarks || null, requestId]
    );

    await client.query('COMMIT'); // Commit transaction

    // 5. Send notifications (could be moved to background job)
    // await sendApprovalNotifications(requestId);

    return res.status(200).json({
      success: true,
      message: "Request approved successfully",
      data: {
        requestId,
        processedAt,
        assignedCount: allocatedAccommodation.length
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error approving request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release(); // Release client back to pool
  }
};

export const rejectRequest = async (req, res) => {
  const requestId = parseInt(req.params.requestId);
  const { remarks } = req.body;

  // Validate mandatory remarks
  if (!remarks || remarks.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Remarks are mandatory when rejecting a request' 
    });
  }

  const client = await db.connect(); // Get a DB client for transaction

  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Validate and lock the request
    const requestRes = await client.query(
      `SELECT id, status 
       FROM requests 
       WHERE id = $1 
       FOR UPDATE`, // Lock row for update
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    const request = requestRes.rows[0];
    
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        message: 'Request already processed' 
      });
    }

    // 2. Update request status to rejected
    const processedAt = new Date();
    await client.query(
      `UPDATE requests
       SET status = 'rejected', 
           processed_at = $1,
           remarks = $2
       WHERE id = $3`,
      [processedAt, remarks, requestId]
    );

    await client.query('COMMIT'); // Commit transaction

    // 3. Send rejection notification (could be moved to background job)
    // await sendRejectionNotification(requestId, remarks);

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully",
      data: {
        requestId,
        processedAt,
        remarks
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error rejecting request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing rejection",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release(); // Release client back to pool
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