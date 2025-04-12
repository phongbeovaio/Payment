const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Các route xử lý thanh toán cũ
router.post('/process', paymentController.processPayment);
router.post('/cancel', paymentController.cancelPayment);
router.get('/confirm', paymentController.confirmPayment);
router.get('/invoice/:invoiceId', paymentController.getInvoice);

// Các API để lấy & thêm giao dịch
router.get('/payments', paymentController.getAllPayments); // Lấy danh sách thanh toán
router.post('/payments', paymentController.createPayment); // Tạo một giao dịch mới

module.exports = router;