const Database = require('./database');

class UserService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Validate user data
  validateUserData(userData) {
    const { name, email, phone } = userData;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('الاسم مطلوب ويجب أن يكون نص صالح');
    } else if (name.trim().length < 2) {
      errors.push('الاسم يجب أن يكون على الأقل حرفين');
    }

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push('البريد الإلكتروني مطلوب');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('البريد الإلكتروني غير صالح');
      }
    }

    // Validate phone (optional but if provided, should be valid)
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.push('رقم الهاتف غير صالح');
      }
    }

    return errors;
  }

  // Create a new user
  async createUser(userData) {
    try {
      // Validate input data
      const validationErrors = this.validateUserData(userData);
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في التحقق من البيانات: ${validationErrors.join(', ')}`);
      }

      // Clean and prepare data
      const cleanData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        phone: userData.phone ? userData.phone.trim() : null
      };

      // Save to database
      const savedUser = await this.database.saveUser(cleanData);
      
      return {
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        user: savedUser
      };

    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في إنشاء المستخدم',
        user: null
      };
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const users = await this.database.getAllUsers();
      return {
        success: true,
        message: 'تم جلب المستخدمين بنجاح',
        users: users
      };
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error.message);
      return {
        success: false,
        message: 'فشل في جلب المستخدمين',
        users: []
      };
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('معرف المستخدم غير صالح');
      }

      const user = await this.database.getUserById(id);
      if (!user) {
        return {
          success: false,
          message: 'المستخدم غير موجود',
          user: null
        };
      }

      return {
        success: true,
        message: 'تم جلب المستخدم بنجاح',
        user: user
      };
    } catch (error) {
      console.error('خطأ في جلب المستخدم:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب المستخدم',
        user: null
      };
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = UserService;