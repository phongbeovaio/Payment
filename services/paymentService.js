const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const User = require('../models/User');

class PaymentService {
  // Các hàm cũ (giữ nguyên logic, điều chỉnh cú pháp)
  async mockThirdPartyPayment(orderId, amount, paymentMethod) {
    const mockResponse = {
      success: Math.random() > 0.2,
      transactionId: `TRANS_${Date.now()}`,
      message: Math.random() > 0.2 ? 'Payment successful' : 'Payment failed due to insufficient funds',
    };
    return mockResponse;
  }

  async processPayment(orderId, userId, paymentMethod) {
    try {
      // Thay đổi từ findById sang findByPk trong Sequelize
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Order is not in a payable state');
      }

      const paymentResult = await this.mockThirdPartyPayment(orderId, order.totalAmount, paymentMethod);

      if (paymentResult.success) {
        // Cập nhật thuộc tính và lưu trong Sequelize
        order.status = 'paid';
        order.paymentStatus = 'completed';
        order.transactionId = paymentResult.transactionId;
        await order.save();

        // Lưu giao dịch vào Payment
        await this.createPayment({
          orderId,
          userId,
          amount: order.totalAmount,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: 'completed',
        });

        const invoice = await this.createInvoice(orderId, userId);
        return {
          success: true,
          message: 'Payment successful',
          transactionId: paymentResult.transactionId,
          invoiceId: invoice.id, // Thay _id bằng id trong SQL
        };
      } else {
        order.paymentStatus = 'failed';
        await order.save();
        throw new Error(paymentResult.message);
      }
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async cancelPayment(orderId) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'paid') {
        throw new Error('Cannot cancel a completed payment');
      }

      order.status = 'cancelled';
      order.paymentStatus = 'cancelled';
      await order.save();

      return { success: true, message: 'Payment cancelled successfully' };
    } catch (error) {
      throw new Error(`Payment cancellation failed: ${error.message}`);
    }
  }

  async confirmPayment(orderId, transactionId) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.transactionId === transactionId && order.paymentStatus === 'completed') {
        return { success: true, message: 'Payment confirmed', order };
      } else {
        throw new Error('Payment confirmation failed: Invalid transaction');
      }
    } catch (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  async createInvoice(orderId, userId) {
    try {
      // Thay đổi cách truy vấn và populate
      const order = await Order.findByPk(orderId, {
        include: ['items'] // Thay populate bằng include trong Sequelize
      });
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Thay đổi cách tạo và lưu dữ liệu
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

  async getInvoice(invoiceId) {
    try {
      // Thay populate bằng include trong Sequelize
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          { model: Order, as: 'Order' },
          { model: User, as: 'User' }
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

  // Hàm lấy danh sách giao dịch
  async getAllPayments() {
    try {
      // Thay populate bằng include trong Sequelize
      const payments = await Payment.findAll({
        include: [
          { model: Order, as: 'Order' },
          { model: User, as: 'User' }
        ]
      });
      return payments;
    } catch (error) {
      throw new Error(`Failed to retrieve payments: ${error.message}`);
    }
  }

  // Hàm tạo giao dịch
  async createPayment({ orderId, userId, amount, paymentMethod, transactionId, status }) {
    try {
      // Thay đổi cách tạo và lưu dữ liệu
      const payment = await Payment.create({
        orderId,
        userId,
        transactionId: transactionId || `TRANS_${Date.now()}`,
        amount,
        paymentMethod,
        status: status || 'pending',
      });
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();