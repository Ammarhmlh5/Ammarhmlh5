#!/usr/bin/env node

const Database = require('./database');
const bcrypt = require('bcrypt');

async function verifyUserLogin() {
  const database = new Database();
  
  try {
    console.log('🔍 التحقق من بيانات السوبر أدمن...');
    
    // Initialize database
    await database.init();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    const superAdminEmail = 'alhomaly1983@gmail.com';
    const superAdminPassword = '123456789';

    // Get user from database
    const user = await database.getUserByEmail(superAdminEmail);
    
    if (!user) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
      console.log('💡 يرجى تشغيل: node setup_super_admin.js');
      return;
    }

    console.log('✅ تم العثور على المستخدم');
    console.log(`📧 البريد الإلكتروني: ${user.email}`);
    console.log(`👤 الاسم: ${user.name}`);
    console.log(`👑 الدور: ${user.role}`);
    console.log(`✅ حالة التفعيل: ${user.is_active ? 'مفعل' : 'غير مفعل'}`);
    console.log(`🆔 معرف المستخدم: ${user.id}`);

    // Check password
    if (!user.password) {
      console.log('❌ لا توجد كلمة مرور للمستخدم');
      console.log('💡 يرجى تشغيل: node setup_super_admin.js');
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(superAdminPassword, user.password);
    if (isPasswordValid) {
      console.log('✅ كلمة المرور صحيحة');
    } else {
      console.log('❌ كلمة المرور غير صحيحة');
      console.log('💡 يرجى تشغيل: node setup_super_admin.js');
      return;
    }

    // Check account status
    if (!user.is_active) {
      console.log('❌ الحساب غير مفعل');
      console.log('💡 يرجى تشغيل: node setup_super_admin.js');
      return;
    }

    // Check role
    if (user.role !== 'system_admin') {
      console.log('❌ الدور غير صحيح');
      console.log(`📝 الدور الحالي: ${user.role}`);
      console.log('💡 يرجى تشغيل: node setup_super_admin.js');
      return;
    }

    console.log('\n🎉 جميع الفحوصات نجحت! بيانات السوبر أدمن صحيحة');
    console.log('\n📋 بيانات تسجيل الدخول:');
    console.log(`📧 البريد الإلكتروني: ${superAdminEmail}`);
    console.log(`🔐 كلمة المرور: ${superAdminPassword}`);
    console.log('\n🌐 يمكنك الآن تسجيل الدخول على: http://localhost:3000');

  } catch (error) {
    console.error('❌ خطأ في التحقق:', error.message);
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

// Run the verification if called directly
if (require.main === module) {
  verifyUserLogin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ فشل في التحقق:', error.message);
    process.exit(1);
  });
}

module.exports = verifyUserLogin;