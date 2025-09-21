# نظام إدارة المستخدمين
## User Management System

نظام شامل لإدارة المستخدمين مع حفظ آمن في قاعدة البيانات، مصمم لحل مشكلة عدم القدرة على حفظ بيانات المستخدمين الجدد.

A comprehensive user management system with secure database persistence, designed to resolve the issue of inability to save new user data.

## المزايا الرئيسية | Key Features

- ✅ **حفظ آمن للمستخدمين** - Secure user data persistence
- ✅ **واجهة عربية سهلة الاستخدام** - User-friendly Arabic interface  
- ✅ **التحقق من صحة البيانات** - Data validation and error handling
- ✅ **منع التكرار** - Duplicate email prevention
- ✅ **API متكامل** - Complete REST API
- ✅ **قاعدة بيانات SQLite** - SQLite database integration

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

## استخدام API | API Usage

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