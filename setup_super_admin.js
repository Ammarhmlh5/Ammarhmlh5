#!/usr/bin/env node

const bcrypt = require('bcrypt');
const Database = require('./database');

async function setupSuperAdmin() {
  const database = new Database();
  
  try {
    console.log('🚀 بدء إعداد حساب السوبر أدمن...');
    
    // Initialize database
    await database.init();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    const superAdminEmail = 'alhomaly1983@gmail.com';
    const superAdminPassword = '123456789';
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    // Check if user already exists
    const existingUser = await database.getUserByEmail(superAdminEmail);
    
    if (existingUser) {
      console.log('👤 المستخدم موجود بالفعل، سيتم تحديث بياناته...');
      
      // Update existing user to be system_admin with new password
      await database.db.run(
        'UPDATE users SET role = ?, password = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        ['system_admin', hashedPassword, superAdminEmail]
      );
      
      console.log('✅ تم تحديث المستخدم ليصبح سوبر أدمن بنجاح');
      console.log(`📧 البريد الإلكتروني: ${superAdminEmail}`);
      console.log(`🔐 كلمة المرور: ${superAdminPassword}`);
      console.log(`👑 الدور: system_admin`);
      
    } else {
      console.log('👤 إنشاء مستخدم جديد...');
      
      // Create new super admin user
      const newUser = await database.saveUser({
        name: 'Super Admin',
        email: superAdminEmail,
        role: 'system_admin',
        is_active: 1
      });
      
      // Set password for the new user
      await database.updateUserPassword(newUser.id, hashedPassword);
      
      console.log('✅ تم إنشاء السوبر أدمن بنجاح');
      console.log(`👤 اسم المستخدم: ${newUser.name}`);
      console.log(`📧 البريد الإلكتروني: ${superAdminEmail}`);
      console.log(`🔐 كلمة المرور: ${superAdminPassword}`);
      console.log(`👑 الدور: system_admin`);
      console.log(`🆔 معرف المستخدم: ${newUser.id}`);
    }

    // Verify the setup
    const verifyUser = await database.getUserByEmail(superAdminEmail);
    if (verifyUser && verifyUser.role === 'system_admin' && verifyUser.password) {
      console.log('✅ تم التحقق من إعداد السوبر أدمن بنجاح');
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare(superAdminPassword, verifyUser.password);
      if (isPasswordValid) {
        console.log('✅ تم التحقق من كلمة المرور بنجاح');
      } else {
        console.error('❌ فشل في التحقق من كلمة المرور');
      }
    } else {
      console.error('❌ فشل في إعداد السوبر أدمن');
    }

  } catch (error) {
    console.error('❌ خطأ في إعداد السوبر أدمن:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (database.db) {
      database.db.close((err) => {
        if (err) {
          console.error('خطأ في إغلاق قاعدة البيانات:', err.message);
        } else {
          console.log('🔐 تم إغلاق الاتصال بقاعدة البيانات');
        }
      });
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  setupSuperAdmin().then(() => {
    console.log('🎉 تم الانتهاء من إعداد السوبر أدمن');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ فشل في إعداد السوبر أدمن:', error.message);
    process.exit(1);
  });
}

module.exports = setupSuperAdmin;