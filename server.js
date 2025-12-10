const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection (Only initialize ONCE in serverless)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
    isConnected = true;
  } catch (err) {
    console.log("MongoDB Error:", err);
  }
}
connectDB();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/auth', require('./routes/auth'));

// ❌ STOP — NO app.listen() ON VERCEL
// Instead export the app:
module.exports = app;
