# نظام إدارة المستخدمين والشركات
## User and Company Management System

نظام شامل لإدارة المستخدمين والشركات مع تسجيل الشركات الجديدة وتفعيل حساب المدير تلقائياً، مصمم لحل مشكلة عدم القدرة على حفظ بيانات المستخدمين الجدد وإضافة نظام إدارة الشركات.

A comprehensive user and company management system with automatic admin user activation for new companies, designed to resolve user data persistence issues and add company management capabilities.

## المزايا الرئيسية | Key Features

- ✅ **تسجيل الشركات الجديدة** - New company registration with automatic admin activation
- ✅ **إدارة المستخدمين** - Comprehensive user management with roles
- ✅ **حفظ آمن للمستخدمين والشركات** - Secure data persistence for users and companies
- ✅ **واجهة عربية سهلة الاستخدام** - User-friendly Arabic interface with tabs
- ✅ **التحقق من صحة البيانات** - Data validation and error handling
- ✅ **منع التكرار** - Duplicate email prevention for users and companies
- ✅ **API متكامل** - Complete REST API with company endpoints
- ✅ **قاعدة بيانات SQLite** - SQLite database with relational schema
- ✅ **تفعيل المدير تلقائياً** - Automatic admin user activation for new companies
- ✅ **إدارة الأدوار** - User role management (admin/user)

## التثبيت والتشغيل | Installation & Setup

### 1. تثبيت التبعيات | Install Dependencies
```bash
npm install
```

### 2. تشغيل الخادم | Start Server
```bash
npm start
```

### 3. الوصول للتطبيق | Access Application
- **الواجهة الرئيسية | Main Interface**: http://localhost:3000
- **API الصحة | Health API**: http://localhost:3000/api/health
- **API المستخدمين | Users API**: http://localhost:3000/api/users
- **API الشركات | Companies API**: http://localhost:3000/api/companies

## استخدام API | API Usage

### تسجيل شركة جديدة مع تفعيل المدير | Register New Company with Admin
```bash
curl -X POST http://localhost:3000/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "شركة التقنية المتطورة",
    "email": "info@techcompany.com",
    "phone": "0501234567",
    "address": "الرياض، المملكة العربية السعودية",
    "description": "شركة متخصصة في حلول التقنية",
    "adminName": "أحمد محمد",
    "adminEmail": "admin@techcompany.com",
    "adminPhone": "0509876543"
  }'
```

### جلب جميع الشركات | Get All Companies
```bash
curl -X GET http://localhost:3000/api/companies
```

### جلب مستخدمي شركة معينة | Get Company Users
```bash
curl -X GET http://localhost:3000/api/companies/1/users
```

### إضافة مستخدم جديد | Create New User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "email": "ahmed@example.com", 
    "phone": "0501234567"
  }'
```

### جلب جميع المستخدمين | Get All Users
```bash
curl -X GET http://localhost:3000/api/users
```

### جلب مستخدم بالمعرف | Get User by ID
```bash
curl -X GET http://localhost:3000/api/users/1
```

## البنية التقنية | Technical Structure

```
├── server.js           # الخادم الرئيسي | Main server
├── database.js         # إدارة قاعدة البيانات | Database management
├── userService.js      # خدمات المستخدمين | User services
├── userService.test.js # اختبارات النظام | System tests
├── package.json        # إعدادات المشروع | Project configuration
├── public/
│   └── index.html      # الواجهة الأمامية | Frontend interface
└── users.db           # قاعدة البيانات | Database file (auto-generated)
```

## الاختبار | Testing

### تشغيل الاختبارات | Run Tests
```bash
npm test
```

### اختبار يدوي | Manual Testing
1. افتح المتصفح على http://localhost:3000
2. املأ النموذج بالبيانات المطلوبة
3. اضغط "حفظ المستخدم"
4. تحقق من ظهور المستخدم في القائمة

## حل المشاكل | Troubleshooting

### خطأ في الاتصال بقاعدة البيانات | Database Connection Error
- تأكد من صلاحيات الكتابة في مجلد المشروع
- تحقق من عدم وجود عمليات أخرى تستخدم قاعدة البيانات

### خطأ في المنفذ | Port Error
- تأكد من أن المنفذ 3000 غير مستخدم
- يمكن تغيير المنفذ عبر متغير البيئة `PORT`

```bash
PORT=3001 npm start
```

## المساهمة | Contributing

1. انسخ المستودع | Fork the repository
2. أنشئ فرع للميزة الجديدة | Create feature branch
3. اعمل التغييرات | Make changes
4. أرسل طلب دمج | Submit pull request

## الترخيص | License

MIT License - يمكن استخدام المشروع بحرية | Free to use

---

**ملاحظة**: تم حل مشكلة عدم القدرة على حفظ المستخدمين بالكامل ✅  
**Note**: The user saving issue has been completely resolved ✅