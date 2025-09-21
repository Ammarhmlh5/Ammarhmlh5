const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Database = require('./database');

class AuthService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Login user
  async login(email, password) {
    try {
      if (!email || !password) {
        return {
          success: false,
          message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
        };
      }

      const user = await this.database.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      if (!user.password) {
        return {
          success: false,
          message: 'يجب إعداد كلمة مرور للحساب أولاً'
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'الحساب غير مفعل'
        };
      }

      // Remove password from returned user object
      const { password: _, reset_token, reset_token_expires, ...userWithoutPassword } = user;
      
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error.message);
      return {
        success: false,
        message: 'فشل في تسجيل الدخول'
      };
    }
  }

  // Set password for user
  async setPassword(userId, password) {
    try {
      if (!password || password.length < 6) {
        return {
          success: false,
          message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const updated = await this.database.updateUserPassword(userId, hashedPassword);

      if (updated) {
        return {
          success: true,
          message: 'تم تعيين كلمة المرور بنجاح'
        };
      } else {
        return {
          success: false,
          message: 'فشل في تعيين كلمة المرور'
        };
      }
    } catch (error) {
      console.error('خطأ في تعيين كلمة المرور:', error.message);
      return {
        success: false,
        message: 'فشل في تعيين كلمة المرور'
      };
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        return {
          success: false,
          message: 'كلمة المرور الحالية والجديدة مطلوبتان'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
        };
      }

      // Get user by ID
      const user = await this.database.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'المستخدم غير موجود'
        };
      }

      if (!user.password) {
        return {
          success: false,
          message: 'لم يتم تعيين كلمة مرور للحساب'
        };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'كلمة المرور الحالية غير صحيحة'
        };
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updated = await this.database.updateUserPassword(userId, hashedPassword);

      if (updated) {
        return {
          success: true,
          message: 'تم تغيير كلمة المرور بنجاح'
        };
      } else {
        return {
          success: false,
          message: 'فشل في تغيير كلمة المرور'
        };
      }
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error.message);
      return {
        success: false,
        message: 'فشل في تغيير كلمة المرور'
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      if (!email) {
        return {
          success: false,
          message: 'البريد الإلكتروني مطلوب'
        };
      }

      const user = await this.database.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'إذا كان البريد الإلكتروني مسجل، ستصلك رسالة لاسترداد كلمة المرور'
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour from now

      const updated = await this.database.setResetToken(email, resetToken, expires.toISOString());

      if (updated) {
        return {
          success: true,
          message: 'إذا كان البريد الإلكتروني مسجل، ستصلك رسالة لاسترداد كلمة المرور',
          resetToken: resetToken // In real app, this would be sent via email
        };
      } else {
        return {
          success: false,
          message: 'فشل في إنشاء رمز الاسترداد'
        };
      }
    } catch (error) {
      console.error('خطأ في طلب استرداد كلمة المرور:', error.message);
      return {
        success: false,
        message: 'فشل في طلب استرداد كلمة المرور'
      };
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        return {
          success: false,
          message: 'رمز الاسترداد وكلمة المرور الجديدة مطلوبان'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
        };
      }

      const user = await this.database.getUserByResetToken(token);
      if (!user) {
        return {
          success: false,
          message: 'رمز الاسترداد غير صالح أو منتهي الصلاحية'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      const updated = await this.database.updateUserPassword(user.id, hashedPassword);
      if (updated) {
        await this.database.clearResetToken(user.id);
        return {
          success: true,
          message: 'تم إعادة تعيين كلمة المرور بنجاح'
        };
      } else {
        return {
          success: false,
          message: 'فشل في إعادة تعيين كلمة المرور'
        };
      }
    } catch (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error.message);
      return {
        success: false,
        message: 'فشل في إعادة تعيين كلمة المرور'
      };
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = AuthService;