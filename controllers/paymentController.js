const PaymentService = require('../services/paymentService');

class PaymentController {
  // Xử lý thanh toán
  async processPayment(req, res) {
    try {
      const { orderId, userId, paymentMethod } = req.body;
      const result = await PaymentService.processPayment(orderId, userId, paymentMethod);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Hủy thanh toán
  async cancelPayment(req, res) {
    try {
      const { orderId } = req.body;
      const result = await PaymentService.cancelPayment(orderId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Xác nhận thanh toán
  async confirmPayment(req, res) {
    try {
      const { orderId, transactionId } = req.query;
      const result = await PaymentService.confirmPayment(orderId, transactionId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy hóa đơn
  async getInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const invoice = await PaymentService.getInvoice(invoiceId);
      res.status(200).json({ success: true, invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách tất cả các giao dịch thanh toán
  async getAllPayments(req, res) {
    try {
      const payments = await PaymentService.getAllPayments();
      res.status(200).json({ success: true, payments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Tạo một giao dịch thanh toán mới
  async createPayment(req, res) {
    try {
      const { orderId, userId, amount, paymentMethod } = req.body;

      // Validation cơ bản
      if (!orderId || !userId || !amount || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const payment = await PaymentService.createPayment({ orderId, userId, amount, paymentMethod });
      res.status(201).json({ success: true, payment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();