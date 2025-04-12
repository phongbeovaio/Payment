// app.js
const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Load biến môi trường
dotenv.config();

const app = express();

// Kết nối và đồng bộ database
sequelize.authenticate()
  .then(() => {
    console.log('Connected to MySQL database');
    // Đồng bộ models với database
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database tables synchronized');
  })
  .catch(err => console.error('Database connection error:', err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/payment', require('./routes/paymentRoutes'));

// Khởi động server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));