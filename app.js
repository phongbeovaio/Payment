/**
 * File khởi động chính của ứng dụng
 * Cấu hình Express server và kết nối database
 */
const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Load các biến môi trường từ file .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

/**
 * Kết nối đến cơ sở dữ liệu MySQL thông qua Sequelize
 * Và đồng bộ hóa các model với cấu trúc bảng trong database
 */
sequelize.authenticate()
  .then(() => {
    console.log('Connected to MySQL database');
    
    // Đồng bộ các model với database
    // alter: true cho phép Sequelize tự động cập nhật cấu trúc bảng nếu có thay đổi
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database tables synchronized');
  })
  .catch(err => console.error('Database connection error:', err));

// Middleware để xử lý dữ liệu JSON trong request body
app.use(express.json());

// Đăng ký các routes cho API thanh toán
// Tất cả các API thanh toán sẽ có tiền tố /api/payment
app.use('/api/payment', require('./routes/paymentRoutes'));

// Khởi động server trên cổng được cấu hình trong biến môi trường
// Nếu không có, sử dụng cổng 3001 làm mặc định
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
