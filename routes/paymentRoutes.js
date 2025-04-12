const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route xử lý yêu cầu thanh toán
// POST /api/payments/process
// Body: { orderId, userId, paymentMethod }
router.post('/process', paymentController.processPayment);

// Route xử lý hủy thanh toán
// POST /api/payments/cancel
// Body: { orderId }
router.post('/cancel', paymentController.cancelPayment);

// Route xác nhận thanh toán đã hoàn tất
// GET /api/payments/confirm?orderId=xxx&transactionId=yyy
router.get('/confirm', paymentController.confirmPayment);

// Route lấy thông tin chi tiết hóa đơn
// GET /api/payments/invoice/:invoiceId
router.get('/invoice/:invoiceId', paymentController.getInvoice);

// Route lấy danh sách tất cả các giao dịch thanh toán
// GET /api/payments
router.get('/payments', paymentController.getAllPayments);

// Route tạo một giao dịch thanh toán mới
// POST /api/payments
// Body: { orderId, userId, amount, paymentMethod }
router.post('/payments', paymentController.createPayment);

module.exports = router;
