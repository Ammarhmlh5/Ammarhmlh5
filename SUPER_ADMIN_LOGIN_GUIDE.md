# دليل تسجيل دخول السوبر أدمن / Super Admin Login Guide

## بيانات تسجيل الدخول / Login Credentials

### بيانات السوبر أدمن الافتراضية / Default Super Admin Credentials:
- **البريد الإلكتروني / Email**: `alhomaly1983@gmail.com`
- **كلمة المرور / Password**: `123456789`
- **الدور / Role**: `system_admin` (مدير النظام)

## خطوات تسجيل الدخول / Login Steps

### 1. إعداد حساب السوبر أدمن / Setup Super Admin Account
```bash
# تشغيل إعداد السوبر أدمن / Run super admin setup
node setup_super_admin.js
```

### 2. تشغيل الخادم / Start Server
```bash
# تشغيل الخادم / Start the server
npm start
```

### 3. فتح التطبيق / Open Application
افتح المتصفح وتوجه إلى / Open browser and navigate to:
```
http://localhost:3000
```

### 4. تسجيل الدخول / Login Process
1. انقر على زر "تسجيل الدخول" / Click "تسجيل الدخول" button
2. أدخل البريد الإلكتروني / Enter email: `alhomaly1983@gmail.com`
3. أدخل كلمة المرور / Enter password: `123456789`
4. انقر على "تسجيل الدخول" / Click "تسجيل الدخول"

## استكشاف الأخطاء / Troubleshooting

### مشكلة: لا يمكن تسجيل الدخول / Issue: Cannot Login

#### الحلول المحتملة / Possible Solutions:

1. **تأكد من تشغيل إعداد السوبر أدمن / Ensure Super Admin Setup is Run**
   ```bash
   node setup_super_admin.js
   ```
   يجب أن تظهر الرسالة / You should see the message:
   ```
   ✅ تم إنشاء السوبر أدمن بنجاح
   ```

2. **تحقق من البيانات المدخلة / Verify Input Data**
   - تأكد من صحة البريد الإلكتروني / Verify email is correct
   - تأكد من صحة كلمة المرور / Verify password is correct
   - تأكد من عدم وجود مسافات إضافية / Check for extra spaces

3. **تحقق من حالة الحساب / Check Account Status**
   - يجب أن يكون الحساب مفعل (`is_active = 1`) / Account must be active
   - يجب أن يكون الدور `system_admin` / Role must be `system_admin`

4. **إعادة إنشاء السوبر أدمن / Recreate Super Admin**
   إذا لم تعمل البيانات، امسح قاعدة البيانات وأعد الإعداد:
   ```bash
   # حذف قاعدة البيانات / Delete database
   rm users.db
   
   # إعادة إعداد السوبر أدمن / Recreate super admin
   node setup_super_admin.js
   ```

### رسائل الخطأ الشائعة / Common Error Messages

| رسالة الخطأ / Error Message | السبب / Cause | الحل / Solution |
|------------------------------|---------------|-----------------|
| "البريد الإلكتروني أو كلمة المرور غير صحيحة" | بيانات خاطئة / Wrong credentials | تحقق من البيانات المدخلة / Verify input data |
| "يجب إعداد كلمة مرور للحساب أولاً" | لا توجد كلمة مرور / No password set | أعد تشغيل setup_super_admin.js / Re-run setup_super_admin.js |
| "الحساب غير مفعل" | الحساب غير مفعل / Account not active | أعد تشغيل setup_super_admin.js / Re-run setup_super_admin.js |

## التحقق من نجاح تسجيل الدخول / Verify Successful Login

بعد تسجيل الدخول بنجاح، يجب أن ترى:
After successful login, you should see:

1. رسالة "تم تسجيل الدخول بنجاح" / "Login successful" message
2. شريط علوي يحتوي على البريد الإلكتروني / Top bar with email address
3. زر "تسجيل الخروج" / "Logout" button
4. الوصول إلى جميع وظائف النظام / Access to all system functions

## تغيير كلمة المرور / Change Password

لتغيير كلمة مرور السوبر أدمن:
To change super admin password:

1. سجل الدخول إلى النظام / Login to the system
2. انتقل إلى "إدارة كلمة المرور" / Go to "Password Management"
3. اختر "تغيير كلمة المرور" / Select "Change Password"
4. أدخل كلمة المرور الحالية والجديدة / Enter current and new password

## دعم إضافي / Additional Support

في حالة استمرار المشاكل، تحقق من:
If issues persist, check:

1. سجلات الخادم / Server logs
2. تحقق من أن المنفذ 3000 متاح / Verify port 3000 is available
3. تأكد من تثبيت جميع المتطلبات / Ensure all dependencies are installed:
   ```bash
   npm install
   ```