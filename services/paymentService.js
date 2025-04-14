// Import các model cần thiết từ thư mục models
const Order = require('../models/Order');        // Model quản lý đơn hàng
const Invoice = require('../models/Invoice');    // Model quản lý hóa đơn
const Payment = require('../models/Payment');    // Model quản lý thanh toán
const User = require('../models/User');          // Model quản lý người dùng

/**
 * Service xử lý các chức năng liên quan đến thanh toán
 * Bao gồm: xử lý thanh toán, hủy thanh toán, xác nhận thanh toán,
 * tạo hóa đơn, lấy thông tin hóa đơn và quản lý giao dịch
 */
class PaymentService {
 
  /**
   * Giả lập thanh toán qua bên thứ ba
   * @param {string} orderId - ID của đơn hàng
   * @param {number} amount - Số tiền thanh toán
   * @param {string} paymentMethod - Phương thức thanh toán
   * @returns {Object} Kết quả thanh toán giả lập (success/fail)
   */
  async mockThirdPartyPayment(orderId, amount, paymentMethod) {
    // Tạo kết quả giả lập với tỷ lệ thành công 80%
    const mockResponse = {
      success: Math.random() > 0.2, // 80% khả năng thành công
      transactionId: `TRANS_${Date.now()}`, // Tạo ID giao dịch duy nhất
      message: Math.random() > 0.2 ? 'Payment successful' : 'Payment failed due to insufficient funds',
    };
    return mockResponse;
  }

  /**
   * Xử lý thanh toán cho đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @param {string} userId - ID của người dùng
   * @param {string} paymentMethod - Phương thức thanh toán
   * @returns {Object} Kết quả xử lý thanh toán
   */
  async processPayment(orderId, userId, paymentMethod) {
    try {
      // Tìm đơn hàng theo ID sử dụng Sequelize
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Kiểm tra trạng thái đơn hàng có thể thanh toán không
      if (order.status !== 'pending') {
        throw new Error('Order is not in a payable state');
      }

      // Gọi hàm giả lập thanh toán qua bên thứ ba
      const paymentResult = await this.mockThirdPartyPayment(orderId, order.totalAmount, paymentMethod);

      if (paymentResult.success) {
        // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
        order.status = 'paid';
        order.paymentStatus = 'completed';
        order.transactionId = paymentResult.transactionId;
        await order.save();

        // Lưu thông tin giao dịch vào bảng Payment
        await this.createPayment({
          orderId,
          userId,
          amount: order.totalAmount,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: 'completed',
        });

        // Tạo hóa đơn cho đơn hàng đã thanh toán
        const invoice = await this.createInvoice(orderId, userId);
        
        // Trả về kết quả thành công
        return {
          success: true,
          message: 'Payment successful',
          transactionId: paymentResult.transactionId,
          invoiceId: invoice.id, // ID của hóa đơn mới tạo
        };
      } else {
        // Nếu thanh toán thất bại, cập nhật trạng thái đơn hàng
        order.paymentStatus = 'failed';
        await order.save();
        throw new Error(paymentResult.message);
      }
    } catch (error) {
      // Xử lý lỗi và ném ngoại lệ
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Hủy thanh toán cho đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @returns {Object} Kết quả hủy thanh toán
   */
  async cancelPayment(orderId) {
    try {
      // Tìm đơn hàng theo ID
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Kiểm tra nếu đơn hàng đã thanh toán thì không thể hủy
      if (order.status === 'paid') {
        throw new Error('Cannot cancel a completed payment');
      }

      // Cập nhật trạng thái đơn hàng thành đã hủy
      order.status = 'cancelled';
      order.paymentStatus = 'cancelled';
      await order.save();

      return { success: true, message: 'Payment cancelled successfully' };
    } catch (error) {
      throw new Error(`Payment cancellation failed: ${error.message}`);
    }
  }

  /**
   * Xác nhận thanh toán đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @param {string} transactionId - ID giao dịch cần xác nhận
   * @returns {Object} Kết quả xác nhận thanh toán
   */
  async confirmPayment(orderId, transactionId) {
    try {
      // Tìm đơn hàng theo ID
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Kiểm tra ID giao dịch và trạng thái thanh toán
      if (order.transactionId === transactionId && order.paymentStatus === 'completed') {
        return { success: true, message: 'Payment confirmed', order };
      } else {
        throw new Error('Payment confirmation failed: Invalid transaction');
      }
    } catch (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Tạo hóa đơn cho đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @param {string} userId - ID của người dùng
   * @returns {Object} Hóa đơn mới được tạo
   */
  async createInvoice(orderId, userId) {
    try {
      // Tìm đơn hàng và lấy thông tin các mặt hàng
      const order = await Order.findByPk(orderId, {
        include: ['items'] // Lấy thêm thông tin các mặt hàng trong đơn hàng
      });
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Tạo hóa đơn mới trong cơ sở dữ liệu
      const invoice = await Invoice.create({
        orderId: order.id,
        userId: userId,
        items: order.items,
        totalAmount: order.totalAmount,
        created_at: new Date(),
      });

      return invoice;
    } catch (error) {
      throw new Error(`Invoice creation failed: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết của hóa đơn
   * @param {string} invoiceId - ID của hóa đơn
   * @returns {Object} Thông tin chi tiết hóa đơn
   */
  async getInvoice(invoiceId) {
    try {
      // Tìm hóa đơn và lấy thêm thông tin đơn hàng và người dùng
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          { model: Order, as: 'Order' }, // Lấy thông tin đơn hàng
          { model: User, as: 'User' }    // Lấy thông tin người dùng
        ]
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      return invoice;
    } catch (error) {
      throw new Error(`Failed to retrieve invoice: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách tất cả các giao dịch thanh toán
   * @returns {Array} Danh sách các giao dịch
   */
  async getAllPayments() {
    try {
      // Lấy tất cả giao dịch kèm thông tin đơn hàng và người dùng
      const payments = await Payment.findAll({
        include: [
          { model: Order, as: 'Order' }, // Lấy thông tin đơn hàng
          { model: User, as: 'User' }    // Lấy thông tin người dùng
        ]
      });
      return payments;
    } catch (error) {
      throw new Error(`Failed to retrieve payments: ${error.message}`);
    }
  }

  /**
   * Tạo giao dịch thanh toán mới
   * @param {Object} paymentData - Dữ liệu giao dịch
   * @param {string} paymentData.orderId - ID đơn hàng
   * @param {string} paymentData.userId - ID người dùng
   * @param {number} paymentData.amount - Số tiền thanh toán
   * @param {string} paymentData.paymentMethod - Phương thức thanh toán
   * @param {string} paymentData.transactionId - ID giao dịch (tùy chọn)
   * @param {string} paymentData.status - Trạng thái giao dịch (tùy chọn)
   * @returns {Object} Giao dịch mới được tạo
   */
  async createPayment({ orderId, userId, amount, paymentMethod, transactionId, status }) {
    try {
      // Tạo giao dịch mới trong cơ sở dữ liệu
      const payment = await Payment.create({
        orderId,
        userId,
        transactionId: transactionId || `TRANS_${Date.now()}`, // Tạo ID nếu không có
        amount,
        paymentMethod,
        status: status || 'pending', // Mặc định là 'pending' nếu không có
      });
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}

// Xuất một instance của PaymentService để sử dụng trong ứng dụng
module.exports = new PaymentService()