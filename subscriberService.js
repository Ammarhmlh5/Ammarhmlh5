const Database = require('./database');

class SubscriberService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Validate subscriber data
  validateSubscriberData(subscriberData) {
    const errors = [];
    const { 
      full_name, address, phone, business_type, meter_system_type, 
      tariff_type, tariff_group, id_card_number, property_ownership, 
      connection_amount, company_id 
    } = subscriberData;

    // Required fields validation
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      errors.push('اسم المشترك مطلوب ويجب أن يكون نص صالح');
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      errors.push('العنوان مطلوب');
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      errors.push('رقم الهاتف مطلوب');
    } else {
      // Validate phone format
      const phoneRegex = /^[\\+]?[0-9\\s\\-\\(\\)]{7,}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.push('رقم الهاتف غير صالح');
      }
    }

    if (!company_id || !Number.isInteger(Number(company_id))) {
      errors.push('معرف الشركة مطلوب ويجب أن يكون رقم صحيح');
    }

    // Optional but validated fields
    if (business_type && (typeof business_type !== 'string' || business_type.trim().length === 0)) {
      errors.push('نوع النشاط يجب أن يكون نص صالح');
    }

    if (meter_system_type && (typeof meter_system_type !== 'string' || meter_system_type.trim().length === 0)) {
      errors.push('نوع نظام العداد يجب أن يكون نص صالح');
    }

    if (tariff_type && (typeof tariff_type !== 'string' || tariff_type.trim().length === 0)) {
      errors.push('نوع التعرفة يجب أن يكون نص صالح');
    }

    if (tariff_group && (typeof tariff_group !== 'string' || tariff_group.trim().length === 0)) {
      errors.push('مجموعة التعرفة يجب أن يكون نص صالح');
    }

    if (id_card_number && (typeof id_card_number !== 'string' || id_card_number.trim().length === 0)) {
      errors.push('رقم البطاقة الشخصية يجب أن يكون نص صالح');
    }

    if (property_ownership && !['ملك', 'إيجار'].includes(property_ownership)) {
      errors.push('ملكية العقار يجب أن تكون "ملك" أو "إيجار"');
    }

    if (connection_amount && (isNaN(Number(connection_amount)) || Number(connection_amount) < 0)) {
      errors.push('مبلغ الربط يجب أن يكون رقم صحيح وغير سالب');
    }

    return errors;
  }

  // Create a new subscriber
  async createSubscriber(subscriberData) {
    try {
      // Validate input data
      const validationErrors = this.validateSubscriberData(subscriberData);
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في التحقق من البيانات: ${validationErrors.join(', ')}`);
      }

      // Clean and prepare subscriber data
      const cleanData = {
        company_id: Number(subscriberData.company_id),
        full_name: subscriberData.full_name.trim(),
        address: subscriberData.address.trim(),
        phone: subscriberData.phone.trim(),
        business_type: subscriberData.business_type ? subscriberData.business_type.trim() : null,
        meter_system_type: subscriberData.meter_system_type ? subscriberData.meter_system_type.trim() : null,
        tariff_type: subscriberData.tariff_type ? subscriberData.tariff_type.trim() : null,
        tariff_group: subscriberData.tariff_group ? subscriberData.tariff_group.trim() : null,
        id_card_number: subscriberData.id_card_number ? subscriberData.id_card_number.trim() : null,
        photo_path: subscriberData.photo_path ? subscriberData.photo_path.trim() : null,
        property_ownership: subscriberData.property_ownership || null,
        connection_amount: subscriberData.connection_amount ? Number(subscriberData.connection_amount) : 0,
        created_by: subscriberData.created_by || null
      };

      // Save to database
      const savedSubscriber = await this.database.saveSubscriber(cleanData);
      
      // Create accounting entries if connection amount > 0
      if (cleanData.connection_amount > 0) {
        await this.createConnectionAccountingEntries(
          savedSubscriber, 
          cleanData.created_by, 
          subscriberData.payment_assigned_to || null
        );
      }

      return {
        success: true,
        message: 'تم إضافة المشترك بنجاح',
        subscriber: savedSubscriber
      };

    } catch (error) {
      console.error('خطأ في إضافة المشترك:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في إضافة المشترك',
        subscriber: null
      };
    }
  }

  // Create accounting entries for connection amount
  async createConnectionAccountingEntries(subscriber, createdBy, paymentAssignedTo = null) {
    try {
      const { company_id, account_number, connection_amount, full_name } = subscriber;
      
      // Entry 1: Debit subscriber account, Credit connection revenue
      const connectionRevenueEntry = {
        company_id: company_id,
        transaction_type: 'connection_revenue',
        amount: connection_amount,
        description: `إيرادات ربط تيار للمشترك ${full_name} - حساب رقم ${account_number}`,
        reference_number: account_number,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: createdBy
      };

      // Entry 2: Debit cash/cashier account, Credit subscriber account (payment received)
      const cashReceiptEntry = {
        company_id: company_id,
        transaction_type: 'cash_receipt',
        amount: connection_amount,
        description: `استلام مبلغ ربط التيار من المشترك ${full_name} - حساب رقم ${account_number}`,
        reference_number: account_number,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: createdBy,
        assigned_to: paymentAssignedTo || createdBy // Assign to specified user or default to creator
      };

      // Save both transactions
      await Promise.all([
        this.database.saveTransaction(connectionRevenueEntry),
        this.database.saveTransaction(cashReceiptEntry)
      ]);

      console.log('تم إنشاء القيود المحاسبية لمبلغ الربط بنجاح');
      
    } catch (error) {
      console.error('خطأ في إنشاء القيود المحاسبية:', error.message);
      // Don't fail the whole operation, just log the error
    }
  }

  // Get all subscribers for a company
  async getSubscribersByCompany(companyId, limit = 50, offset = 0) {
    try {
      const subscribers = await this.database.getSubscribersByCompany(companyId, limit, offset);
      
      return {
        success: true,
        subscribers: subscribers,
        message: 'تم جلب قائمة المشتركين بنجاح'
      };

    } catch (error) {
      console.error('خطأ في جلب قائمة المشتركين:', error.message);
      return {
        success: false,
        subscribers: [],
        message: error.message || 'فشل في جلب قائمة المشتركين'
      };
    }
  }

  // Get subscriber by ID
  async getSubscriberById(subscriberId, companyId) {
    try {
      const subscriber = await this.database.getSubscriberById(subscriberId, companyId);
      
      if (!subscriber) {
        return {
          success: false,
          subscriber: null,
          message: 'المشترك غير موجود'
        };
      }

      return {
        success: true,
        subscriber: subscriber,
        message: 'تم جلب بيانات المشترك بنجاح'
      };

    } catch (error) {
      console.error('خطأ في جلب بيانات المشترك:', error.message);
      return {
        success: false,
        subscriber: null,
        message: error.message || 'فشل في جلب بيانات المشترك'
      };
    }
  }

  // Get subscriber by account number
  async getSubscriberByAccountNumber(accountNumber, companyId) {
    try {
      const subscriber = await this.database.getSubscriberByAccountNumber(accountNumber, companyId);
      
      if (!subscriber) {
        return {
          success: false,
          subscriber: null,
          message: 'المشترك غير موجود'
        };
      }

      return {
        success: true,
        subscriber: subscriber,
        message: 'تم جلب بيانات المشترك بنجاح'
      };

    } catch (error) {
      console.error('خطأ في جلب بيانات المشترك:', error.message);
      return {
        success: false,
        subscriber: null,
        message: error.message || 'فشل في جلب بيانات المشترك'
      };
    }
  }

  // Update subscriber
  async updateSubscriber(subscriberId, companyId, updateData) {
    try {
      // Validate update data
      const validationErrors = this.validateSubscriberData({ ...updateData, company_id: companyId });
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في التحقق من البيانات: ${validationErrors.join(', ')}`);
      }

      // Clean update data
      const cleanData = {
        full_name: updateData.full_name.trim(),
        address: updateData.address.trim(),
        phone: updateData.phone.trim(),
        business_type: updateData.business_type ? updateData.business_type.trim() : null,
        meter_system_type: updateData.meter_system_type ? updateData.meter_system_type.trim() : null,
        tariff_type: updateData.tariff_type ? updateData.tariff_type.trim() : null,
        tariff_group: updateData.tariff_group ? updateData.tariff_group.trim() : null,
        id_card_number: updateData.id_card_number ? updateData.id_card_number.trim() : null,
        photo_path: updateData.photo_path ? updateData.photo_path.trim() : null,
        property_ownership: updateData.property_ownership || null,
        connection_amount: updateData.connection_amount ? Number(updateData.connection_amount) : 0
      };

      const changes = await this.database.updateSubscriber(subscriberId, companyId, cleanData);
      
      if (changes === 0) {
        return {
          success: false,
          message: 'المشترك غير موجود أو لم يتم إجراء أي تغيير'
        };
      }

      return {
        success: true,
        message: 'تم تحديث بيانات المشترك بنجاح'
      };

    } catch (error) {
      console.error('خطأ في تحديث المشترك:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في تحديث المشترك'
      };
    }
  }

  // Deactivate subscriber
  async deactivateSubscriber(subscriberId, companyId) {
    try {
      const changes = await this.database.deactivateSubscriber(subscriberId, companyId);
      
      if (changes === 0) {
        return {
          success: false,
          message: 'المشترك غير موجود'
        };
      }

      return {
        success: true,
        message: 'تم إلغاء تفعيل المشترك بنجاح'
      };

    } catch (error) {
      console.error('خطأ في إلغاء تفعيل المشترك:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في إلغاء تفعيل المشترك'
      };
    }
  }

  // Get users for payment assignment dropdown
  async getUsersForPaymentAssignment(companyId) {
    try {
      const users = await this.database.getUsersByCompany(companyId);
      
      return {
        success: true,
        users: users,
        message: 'تم جلب قائمة المستخدمين بنجاح'
      };

    } catch (error) {
      console.error('خطأ في جلب قائمة المستخدمين:', error.message);
      return {
        success: false,
        users: [],
        message: error.message || 'فشل في جلب قائمة المستخدمين'
      };
    }
  }

  // Close database connection
  close() {
    if (this.database) {
      this.database.close();
    }
  }
}

module.exports = SubscriberService;