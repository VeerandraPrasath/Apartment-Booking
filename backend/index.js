import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import pool from './db.js';

import bookingRoutes from './routes/bookings.js';
import requestRoutes from './routes/requests.js' 
import accommodationsRoute from './routes/accommodations.js'
import cityRoutes from './routes/cities.js';
import occupancyRoutes from './routes/occupancy.js';
import userRoutes from './routes/users.js';
import apartmentRoutes from './routes/apartments.js';
import flatRoutes from './routes/flats.js';
import roomRoutes from './routes/rooms.js';
import bedRoutes from './routes/beds.js';
import availabilityRoutes from './routes/availability.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const {
  CLIENT_ID,
  CLIENT_SECRET,
  TENANT_ID,
  REDIRECT_URI,
  FRONTEND_URL,
  ADMIN
} = process.env;

// Step 1: Redirect to Microsoft login
app.get("/login", (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=openid profile email User.Read`;
  res.redirect(authUrl);
});

// Step 2: Callback from Microsoft with ?code=
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        scope: "User.Read openid profile email",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Step 3: Fetch user info using Graph API
    const userResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const user = userResponse.data;

    // Step 4: Redirect to frontend with user info
const name = user.displayName;
const email = user.mail || user.userPrincipalName;
const jobTitle = user.jobTitle || "Not specified";
const gender='male';
let userId;
try {
  // Check if user exists
  const userCheck = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (userCheck.rows.length === 0) {
    // Insert new user
   const insertResult = await pool.query(
  'INSERT INTO users (name, email, role,gender) VALUES ($1, $2, $3, $4) RETURNING id',
  [name, email, jobTitle,gender]
);
userId = insertResult.rows[0].id;


    console.log("✅ New user created:", name);
  }
  else {
    userId=userCheck.rows[0].id;
    console.log("✅ User already exists:", userCheck.rows[0].name);
  }
} catch (dbErr) {
  console.error("❌ DB User Error:", dbErr.message);
  return res.status(500).send("User creation failed");
}

// Redirect to frontend
const nameEnc = encodeURIComponent(name);
const emailEnc = encodeURIComponent(email);
const jobTitleEnc = encodeURIComponent(jobTitle);

if (email === ADMIN) {
  res.redirect(`${FRONTEND_URL}/admin/requests?name=${nameEnc}&email=${emailEnc}&jobTitle=${jobTitleEnc}&id=${userId}`);
} else {
  res.redirect(`${FRONTEND_URL}/booking?name=${nameEnc}&email=${emailEnc}&jobTitle=${jobTitleEnc}&id=${userId}`);
}

// res.status(200).json({name : user.displayName, email: user.mail || user.userPrincipalName, jobTitle: user.jobTitle || "Not specified"});
  } catch (err) {
    console.error("❌ Auth Error:", err.response?.data || err.message);
    res.status(500).send("Authentication Failed");
  }
});



async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database Connected! Current time:', res.rows[0]);
  } catch (err) {
    console.error('Database Connection Failed:', err);
  }
}

testConnection();

app.use('/api/cities', cityRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/apartments', apartmentRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/rooms',roomRoutes)
app.use('/api/occupancy',occupancyRoutes);
app.use('/api/availability',availabilityRoutes)
app.use('/api/bookings',bookingRoutes)
app.use('/api/requests',requestRoutes)
app.use('/api/accommodation',accommodationsRoute)
app.use('/api/beds',bedRoutes);
app.listen(5001, () => {
  console.log("✅ Server running on http://localhost:5001");
});





