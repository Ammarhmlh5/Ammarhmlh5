#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🧪 اختبار شامل لتسجيل دخول السوبر أدمن');
console.log('='.repeat(50));

async function runTest() {
  try {
    // Test 1: Verify super admin setup using verification script
    console.log('\n🔍 اختبار 1: التحقق من إعداد السوبر أدمن...');
    const verifyScript = require('./verify_super_admin');
    await verifyScript();
    console.log('✅ اختبار 1: نجح');

    // Test 2: Check if server file exists and has correct structure
    console.log('\n🔍 اختبار 2: التحقق من ملف الخادم...');
    const serverPath = path.join(process.cwd(), 'server.js');
    if (!fs.existsSync(serverPath)) {
      throw new Error('ملف الخادم غير موجود');
    }
    
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    if (!serverContent.includes('sharedDatabase')) {
      throw new Error('تحسين قاعدة البيانات غير مطبق');
    }
    console.log('✅ اختبار 2: ملف الخادم محسن ومُعد بشكل صحيح');

    // Test 3: Verify auth service functionality
    console.log('\n🔍 اختبار 3: اختبار خدمة المصادقة...');
    const AuthService = require('./authService');
    const authService = new AuthService();
    await authService.init();
    
    const loginResult = await authService.login('alhomaly1983@gmail.com', '123456789');
    if (loginResult.success) {
      console.log('✅ اختبار 3: نجح تسجيل الدخول');
      console.log(`📧 المستخدم: ${loginResult.user.email}`);
      console.log(`👑 الدور: ${loginResult.user.role}`);
    } else {
      throw new Error(`فشل تسجيل الدخول: ${loginResult.message}`);
    }

    // Test 4: Test invalid credentials
    console.log('\n🔍 اختبار 4: اختبار بيانات خاطئة...');
    const invalidResult = await authService.login('wrong@email.com', 'wrongpassword');
    if (!invalidResult.success) {
      console.log('✅ اختبار 4: تم رفض البيانات الخاطئة بشكل صحيح');
    } else {
      throw new Error('خطأ: تم قبول بيانات خاطئة');
    }

    // Test 5: Test empty credentials
    console.log('\n🔍 اختبار 5: اختبار بيانات فارغة...');
    const emptyResult = await authService.login('', '');
    if (!emptyResult.success && emptyResult.message.includes('مطلوبان')) {
      console.log('✅ اختبار 5: تم رفض البيانات الفارغة بشكل صحيح');
    } else {
      throw new Error('خطأ: لم يتم التعامل مع البيانات الفارغة بشكل صحيح');
    }

    authService.close();

    console.log('\n🎉 جميع الاختبارات نجحت!');
    console.log('\n📋 ملخص النتائج:');
    console.log('✅ إعداد السوبر أدمن يعمل بشكل صحيح');
    console.log('✅ الخادم محسن ومُعد بشكل صحيح');
    console.log('✅ تسجيل الدخول يعمل بالبيانات الصحيحة');
    console.log('✅ يتم رفض البيانات الخاطئة');
    console.log('✅ يتم رفض البيانات الفارغة');
    
    console.log('\n🌐 لتشغيل النظام:');
    console.log('1. شغل الأمر: npm start');
    console.log('2. افتح المتصفح على: http://localhost:3000');
    console.log('3. انقر على "تسجيل الدخول"');
    console.log('4. أدخل البيانات:');
    console.log('   - البريد الإلكتروني: alhomaly1983@gmail.com');
    console.log('   - كلمة المرور: 123456789');

  } catch (error) {
    console.error('❌ فشل الاختبار:', error.message);
    process.exit(1);
  }
}

runTest();