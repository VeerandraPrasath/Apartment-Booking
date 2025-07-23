import pool from '../db.js';
// const ExcelJS = require('exceljs');
import ExcelJS from 'exceljs';

export const getOccupancy = async (req, res) => {
  const { city, apartment, status } = req.query;
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const query = `
    WITH approved_requests AS (
      SELECT r.id, r.date_from, r.date_to
      FROM requests r
      WHERE r.status = 'approved'
    ),
    current_assignments AS (
      SELECT 
        aa.flat_id, 
        aa.room_id, 
        aa.bed_id,
        ar.date_from,
        ar.date_to
      FROM assigned_accommodations aa
      JOIN approved_requests ar ON aa.request_id = ar.id
      WHERE ar.date_from <= $4::date AND ar.date_to >= $4::date
    )

    SELECT 
      a.name AS apartment,
      f.name AS flat,
      r.name AS room,
      b.name AS bed,
      u.name AS occupant,
      ca.date_from AS "checkIn",
      ca.date_to AS "checkOut",
      u.role,
      CASE
        WHEN ca.bed_id IS NOT NULL THEN 'occupied-bed'
        WHEN ca.room_id IS NOT NULL THEN 'occupied-room'
        WHEN ca.flat_id IS NOT NULL THEN 'occupied-flat'
        ELSE 'available'
      END AS current_status
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    JOIN flats f ON r.flat_id = f.id
    JOIN apartments a ON f.apartment_id = a.id
    JOIN cities c ON a.city_id = c.id
    LEFT JOIN users u ON b.occupant_id = u.id
    LEFT JOIN current_assignments ca ON 
      (ca.bed_id = b.id) OR
      (ca.room_id = r.id AND ca.bed_id IS NULL) OR
      (ca.flat_id = f.id AND ca.room_id IS NULL AND ca.bed_id IS NULL)
    WHERE 
      ($1::text IS NULL OR c.name = $1)
      AND ($2::text IS NULL OR a.name = $2)
      AND (
        $3::text IS NULL OR
        ($3 = 'occupied' AND (ca.bed_id IS NOT NULL OR ca.room_id IS NOT NULL OR ca.flat_id IS NOT NULL)) OR
        ($3 = 'available' AND ca.bed_id IS NULL AND ca.room_id IS NULL AND ca.flat_id IS NULL)
      )
    ORDER BY a.name, f.name, r.name, b.name
  `;

  try {
    const { rows } = await pool.query(query, [
      city || null,
      apartment || null,
      status || null,
      currentDate
    ]);

    res.json({ 
      success: true, 
      data: rows,
      meta: {
        currentDate,
        filteredBy: {
          city: city || 'all',
          apartment: apartment || 'all',
          status: status || 'all'
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const exportOccupancy= async (req, res) => {
  const { city, apartment, status } = req.body.filters || {};

  const query = `
    SELECT 
      a.name AS apartment,
      f.name AS flat,
      r.name AS room,
      b.name AS bed,
      u.name AS occupant,
      b.check_in AS "checkIn",
      b.check_out AS "checkOut",
      b.status,
      u.role
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    JOIN flats f ON r.flat_id = f.id
    JOIN apartments a ON f.apartment_id = a.id
    JOIN cities c ON a.city_id = c.id
    LEFT JOIN users u ON b.occupant_id = u.id
    WHERE 
      ($1::text IS NULL OR c.name = $1)
      AND ($2::text IS NULL OR a.name = $2)
      AND ($3::text IS NULL OR b.status = $3)
    ORDER BY a.name, f.name, r.name, b.name
  `;

  try {
    const { rows } = await pool.query(query, [
      city || null,
      apartment || null,
      status || null,
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Occupancy');

    worksheet.columns = [
      { header: 'Apartment', key: 'apartment' },
      { header: 'Flat', key: 'flat' },
      { header: 'Room', key: 'room' },
      { header: 'Bed', key: 'bed' },
      { header: 'Occupant', key: 'occupant' },
      { header: 'Check In', key: 'checkIn' },
      { header: 'Check Out', key: 'checkOut' },
      { header: 'Status', key: 'status' },
      { header: 'Role', key: 'role' },
    ];

    rows.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="occupancy_export.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to export Excel file' });
  }
}