const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');


const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY

// Middleware for API key check
function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
  }
  next();
}

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('PostgreSQL connected...'))
  .catch(err => console.error('DB connection error:', err.stack));

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', checkApiKey);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/api/comfort', async (req, res) => {
  const { station, start, end } = req.query;

  let query = `
    SELECT 
      s.name, 
      s.zipcode, 
      c.recorded_at, 
      c.cci_f, 
      c.environment,
      c.air_temp_f, 
      c.rel_humidity,
      c.solar_radiation,
      c.wind_speed_mph,
      c.temp_humidity_adjustment,
      c.wind_speed_adjustment,
      c.direct_solar_adjustment,
      c.surface_temp_adjustment,
      c.total_radiation_adjustment
    FROM comfort_index c
    JOIN stations s ON c.station_id = s.id
    WHERE 1=1
  `;

  const params = [];

  if (station) {
    params.push(station);
    query += ` AND s.name = $${params.length}`;
  }
  if (start) {
    params.push(start);
    query += ` AND c.recorded_at >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    query += ` AND c.recorded_at <= $${params.length}`;
  }

  query += ` ORDER BY c.recorded_at ASC`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching comfort index data:", err);
    res.status(500).send("Server error");
  }
});

app.get('/api/stations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, latitude, longitude, zipcode FROM stations ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching stations:", err);
    res.status(500).send("Server error");
  }
});

app.get('/api/comfort/latest', async (req, res) => {
  try {
    // Get the CCI data closest to current timestamp for each station
    const query = `
      WITH recent_data AS (
        SELECT
          c.*,
          s.name,
          s.zipcode,
          s.latitude,
          s.longitude,
          ABS(EXTRACT(EPOCH FROM (c.recorded_at - NOW()))) AS seconds_from_now
        FROM comfort_index c
        JOIN stations s ON c.station_id = s.id
        WHERE c.recorded_at >= (NOW() - INTERVAL '7 days')  -- Only look at last 7 days
      ),
      ranked_data AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY station_id
                 ORDER BY seconds_from_now ASC
               ) as rn
        FROM recent_data
      )
      SELECT 
        station_id,
        name,
        zipcode,
        latitude,
        longitude,
        recorded_at,
        cci_f,
        environment,
        air_temp_f,
        rel_humidity,
        solar_radiation,
        wind_speed_mph,
        temp_humidity_adjustment,
        wind_speed_adjustment,
        direct_solar_adjustment,
        surface_temp_adjustment,
        total_radiation_adjustment,
        seconds_from_now
      FROM ranked_data
      WHERE rn = 1
      ORDER BY name ASC;
    `;

    const result = await pool.query(query);
    
    // Log some debug info
    console.log(`Found data closest to current time for ${result.rows.length} stations`);
    if (result.rows.length > 0) {
      const sample = result.rows[0];
      const hoursFromNow = Math.round(sample.seconds_from_now/3600);
      console.log(`Sample: ${sample.name} - ${sample.recorded_at} (${hoursFromNow} hours from current time)`);
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching data closest to current time:", err);
    res.status(500).send("Server error");
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});