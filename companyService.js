const Database = require('./database');
const bcrypt = require('bcryptjs');

class CompanyService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Validate company data
  validateCompanyData(companyData) {
    const { name, email, phone, address, description, adminName, adminEmail, adminPhone } = companyData;
    const errors = [];

    // Validate company name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('اسم الشركة مطلوب ويجب أن يكون نص صالح');
    } else if (name.trim().length < 2) {
      errors.push('اسم الشركة يجب أن يكون على الأقل حرفين');
    }

    // Validate company email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push('البريد الإلكتروني للشركة مطلوب');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('البريد الإلكتروني للشركة غير صالح');
      }
    }

    // Validate company phone (optional but if provided, should be valid)
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.push('رقم هاتف الشركة غير صالح');
      }
    }

    // Validate admin name
    if (!adminName || typeof adminName !== 'string' || adminName.trim().length === 0) {
      errors.push('اسم المدير مطلوب ويجب أن يكون نص صالح');
    } else if (adminName.trim().length < 2) {
      errors.push('اسم المدير يجب أن يكون على الأقل حرفين');
    }

    // Validate admin email
    if (!adminEmail || typeof adminEmail !== 'string' || adminEmail.trim().length === 0) {
      errors.push('البريد الإلكتروني للمدير مطلوب');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail.trim())) {
        errors.push('البريد الإلكتروني للمدير غير صالح');
      }
    }

    // Validate admin phone (optional but if provided, should be valid)
    if (adminPhone && typeof adminPhone === 'string' && adminPhone.trim().length > 0) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
      if (!phoneRegex.test(adminPhone.trim())) {
        errors.push('رقم هاتف المدير غير صالح');
      }
    }

    return errors;
  }

  // Register a new company with admin user
  async registerCompany(companyData) {
    try {
      // Validate input data
      const validationErrors = this.validateCompanyData(companyData);
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في التحقق من البيانات: ${validationErrors.join(', ')}`);
      }

      const { name, email, phone, address, description, adminName, adminEmail, adminPhone, adminPassword } = companyData;

      // Clean and prepare company data
      const cleanCompanyData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        description: description ? description.trim() : null
      };

      // Clean and prepare admin data
      const cleanAdminData = {
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        phone: adminPhone ? adminPhone.trim() : null,
        role: 'admin',
        is_active: 1
      };
      
      // Add password if provided
      if (adminPassword) {
        console.log('Hashing password for admin:', adminEmail);
        cleanAdminData.password = await bcrypt.hash(adminPassword, 10);
        console.log('Password hashed successfully');
      }

      // Save company first
      const savedCompany = await this.database.saveCompany(cleanCompanyData);

      // Add company_id to admin data
      cleanAdminData.company_id = savedCompany.id;

      console.log('Saving admin user with data:', { ...cleanAdminData, password: cleanAdminData.password ? '[HASHED]' : null });
      // Save admin user
      const savedAdmin = await this.database.saveUser(cleanAdminData);

      return {
        success: true,
        message: 'تم تسجيل الشركة وتفعيل حساب المدير بنجاح',
        company: savedCompany,
        admin: savedAdmin
      };

    } catch (error) {
      console.error('خطأ في تسجيل الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في تسجيل الشركة',
        company: null,
        admin: null
      };
    }
  }

  // Get all companies
  async getAllCompanies() {
    try {
      const companies = await this.database.getAllCompanies();
      return {
        success: true,
        message: 'تم جلب الشركات بنجاح',
        companies: companies
      };
    } catch (error) {
      console.error('خطأ في جلب الشركات:', error.message);
      return {
        success: false,
        message: 'فشل في جلب الشركات',
        companies: []
      };
    }
  }

  // Get company by ID
  async getCompanyById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('معرف الشركة غير صالح');
      }

      const company = await this.database.getCompanyById(id);
      if (!company) {
        return {
          success: false,
          message: 'الشركة غير موجودة',
          company: null
        };
      }

      return {
        success: true,
        message: 'تم جلب الشركة بنجاح',
        company: company
      };
    } catch (error) {
      console.error('خطأ في جلب الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب الشركة',
        company: null
      };
    }
  }

  // Get users by company
  async getUsersByCompany(companyId) {
    try {
      if (!companyId || isNaN(companyId)) {
        throw new Error('معرف الشركة غير صالح');
      }

      const users = await this.database.getUsersByCompany(companyId);
      return {
        success: true,
        message: 'تم جلب مستخدمي الشركة بنجاح',
        users: users
      };
    } catch (error) {
      console.error('خطأ في جلب مستخدمي الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب مستخدمي الشركة',
        users: []
      };
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = CompanyService;