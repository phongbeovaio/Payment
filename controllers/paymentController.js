/**
 * Controller xử lý các yêu cầu HTTP liên quan đến thanh toán
 * Làm cầu nối giữa client và PaymentService, xử lý request/response
 */
const PaymentService = require('../services/paymentService');

class PaymentController {
  /**
   * Xử lý yêu cầu thanh toán đơn hàng
   * 
   * @route POST /api/payments/process
   * @param {Object} req - Request object
   * @param {Object} req.body - Dữ liệu từ client
   * @param {string} req.body.orderId - ID của đơn hàng cần thanh toán
   * @param {string} req.body.userId - ID của người dùng thực hiện thanh toán
   * @param {string} req.body.paymentMethod - Phương thức thanh toán (ví dụ: 'credit_card', 'paypal')
   * @param {Object} res - Response object
   * @returns {Object} Kết quả thanh toán với thông tin giao dịch và hóa đơn
   */
  async processPayment(req, res) {
    try {
      // Lấy thông tin cần thiết từ request body
      const { orderId, userId, paymentMethod } = req.body;
      
      // Gọi service để xử lý thanh toán
      const result = await PaymentService.processPayment(orderId, userId, paymentMethod);
      
      // Trả về kết quả thành công
      res.status(200).json(result);
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Xử lý yêu cầu hủy thanh toán
   * 
   * @route POST /api/payments/cancel
   * @param {Object} req - Request object
   * @param {Object} req.body - Dữ liệu từ client
   * @param {string} req.body.orderId - ID của đơn hàng cần hủy thanh toán
   * @param {Object} res - Response object
   * @returns {Object} Kết quả hủy thanh toán
   */
  async cancelPayment(req, res) {
    try {
      // Lấy ID đơn hàng từ request body
      const { orderId } = req.body;
      
      // Gọi service để hủy thanh toán
      const result = await PaymentService.cancelPayment(orderId);
      
      // Trả về kết quả thành công
      res.status(200).json(result);
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Xác nhận thanh toán đã hoàn tất
   * 
   * @route GET /api/payments/confirm
   * @param {Object} req - Request object
   * @param {Object} req.query - Tham số query
   * @param {string} req.query.orderId - ID của đơn hàng
   * @param {string} req.query.transactionId - ID giao dịch cần xác nhận
   * @param {Object} res - Response object
   * @returns {Object} Kết quả xác nhận thanh toán
   */
  async confirmPayment(req, res) {
    try {
      // Lấy thông tin từ query parameters
      const { orderId, transactionId } = req.query;
      
      // Gọi service để xác nhận thanh toán
      const result = await PaymentService.confirmPayment(orderId, transactionId);
      
      // Trả về kết quả thành công
      res.status(200).json(result);
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy thông tin chi tiết của hóa đơn
   * 
   * @route GET /api/invoices/:invoiceId
   * @param {Object} req - Request object
   * @param {Object} req.params - Tham số đường dẫn
   * @param {string} req.params.invoiceId - ID của hóa đơn cần lấy
   * @param {Object} res - Response object
   * @returns {Object} Thông tin chi tiết của hóa đơn
   */
  async getInvoice(req, res) {
    try {
      // Lấy ID hóa đơn từ route parameters
      const { invoiceId } = req.params;
      
      // Gọi service để lấy thông tin hóa đơn
      const invoice = await PaymentService.getInvoice(invoiceId);
      
      // Trả về kết quả thành công kèm dữ liệu hóa đơn
      res.status(200).json({ success: true, invoice });
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy danh sách tất cả các giao dịch thanh toán
   * 
   * @route GET /api/payments
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Danh sách các giao dịch thanh toán
   */
  async getAllPayments(req, res) {
    try {
      // Gọi service để lấy danh sách giao dịch
      const payments = await PaymentService.getAllPayments();
      
      // Trả về kết quả thành công kèm danh sách giao dịch
      res.status(200).json({ success: true, payments });
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Tạo một giao dịch thanh toán mới
   * 
   * @route POST /api/payments
   * @param {Object} req - Request object
   * @param {Object} req.body - Dữ liệu từ client
   * @param {string} req.body.orderId - ID của đơn hàng
   * @param {string} req.body.userId - ID của người dùng
   * @param {number} req.body.amount - Số tiền thanh toán
   * @param {string} req.body.paymentMethod - Phương thức thanh toán
   * @param {Object} res - Response object
   * @returns {Object} Thông tin giao dịch mới được tạo
   */
  async createPayment(req, res) {
    try {
      // Lấy thông tin cần thiết từ request body
      const { orderId, userId, amount, paymentMethod } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!orderId || !userId || !amount || !paymentMethod) {
        // Trả về lỗi 400 Bad Request nếu thiếu thông tin
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Gọi service để tạo giao dịch mới
      const payment = await PaymentService.createPayment({ 
        orderId, 
        userId, 
        amount, 
        paymentMethod 
      });
      
      // Trả về kết quả thành công với status 201 Created
      res.status(201).json({ success: true, payment });
    } catch (error) {
      // Xử lý lỗi và trả về thông báo lỗi với status 400 Bad Request
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

// Xuất một instance của PaymentController để sử dụng trong routes
module.exports = new PaymentController();
