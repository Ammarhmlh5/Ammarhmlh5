# نظام إدارة المستخدمين والشركات - متعدد الشركات
## User and Company Management System - Multi-Tenant

🚀 **نظام متقدم لإدارة الشركات والمستخدمين مع عزل كامل للبيانات**

Advanced multi-tenant system for company and user management with complete data isolation.

## ⭐ **تأكيد: نظام متعدد الشركات بالكامل**

**هذا النظام مصمم ومبني خصيصاً للعمل مع عدد لا محدود من الشركات مع عزل كامل للبيانات:**

✅ **كل شركة منفصلة تماماً**: البيانات، المستخدمين، المعاملات، والتقارير منفصلة 100%  
✅ **لا توجد قيود على عدد الشركات**: يمكن تسجيل أي عدد من الشركات  
✅ **مستخدم واحد، شركات متعددة**: المستخدم يمكنه الوصول لعدة شركات والتبديل بينها  
✅ **واجهة مستخدم متعددة الشركات**: اختيار الشركة وتبديل السياق مدمج في الواجهة

## 🌟 المزايا الرئيسية | Key Features

### 🏢 **نظام متعدد الشركات (Multi-Tenant)**
- **عزل كامل للبيانات**: كل شركة لها بيانات منفصلة تماماً (مستخدمين، معاملات، حسابات، تقارير)
- **إدارة الاشتراكات**: نظام شامل لإدارة خطط الاشتراك والحدود
- **وصول متعدد الشركات**: المستخدمون يمكنهم الوصول لشركات متعددة
- **تبديل سياق الشركة**: تغيير الشركة دون الحاجة لتسجيل خروج

### 💰 **نظام الترقيم الإلكتروني**
- **أرقام إلكترونية فريدة**: كل معاملة مالية لها رقم إلكتروني فريد (SAL2024-000001)
- **تسلسل منفصل لكل شركة**: كل شركة لها تسلسل أرقام منفصل
- **أنواع معاملات متعددة**: مبيعات، مشتريات، إيصالات، قيود يومية
- **إعادة تعيين سنوي**: الأرقام تعاد للصفر كل سنة مالية

### 🔧 **لوحة مدير النظام**
- **إدارة الاشتراكات**: إنشاء، تعليق، وتجديد اشتراكات الشركات
- **خطط متعددة**: أساسية، معيارية، متميزة، مؤسسات
- **مراقبة الاستخدام**: تتبع عدد المستخدمين والمعاملات لكل شركة
- **سجلات النشاط**: تسجيل شامل لجميع إجراءات المديرين

### 🔐 **نظام أمان متقدم**
- **تحكم في الوصول**: middleware تلقائي لضمان عزل البيانات
- **أدوار متعددة**: مستخدم، مدير، مدير نظام
- **جلسات آمنة**: إدارة آمنة لجلسات المستخدمين
- **تشفير كلمات المرور**: تشفير قوي لكلمات المرور

## 📊 خطط الاشتراك | Subscription Plans

| الخطة | المستخدمون | التخزين | المميزات | السعر الشهري |
|-------|-------------|----------|----------|-------------|
| **الأساسية** | 10 | 1GB | إدارة أساسية، معاملات بسيطة | $100 |
| **المعيارية** | 50 | 5GB | معاملات متقدمة، تقارير تفصيلية | $250 |
| **المتميزة** | 200 | 20GB | جميع المميزات، API متقدم | $500 |
| **المؤسسات** | ∞ | ∞ | تخصيص كامل، دعم مخصص 24/7 | $1000 |

## 🛠 التثبيت والتشغيل | Installation & Setup

### المتطلبات | Requirements
- Node.js 18+ 
- npm 9+
- SQLite (مدمج)

### التثبيت | Installation
```bash
# Clone the repository
git clone https://github.com/Ammarhmlh5/Ammarhmlh5.git
cd Ammarhmlh5

# Install dependencies
npm install

# Start the server
npm start
```

## 🌐 استخدام النظام | System Usage

### 1. تسجيل شركة جديدة | Company Registration
1. افتح http://localhost:3000
2. اضغط على "تسجيل شركة جديدة"
3. املأ بيانات الشركة والمدير
4. سيتم إنشاء الشركة وحساب المدير تلقائياً

### 2. تسجيل الدخول | Login
1. اضغط على "تسجيل الدخول"
2. أدخل البريد الإلكتروني وكلمة المرور
3. اختر الشركة من القائمة المنسدلة
4. ستظهر تبويبات المعاملات ولوحة المدير

### 3. إدارة المعاملات | Transaction Management
1. اضغط على تبويب "المعاملات المالية"
2. اختر نوع المعاملة والمبلغ
3. سيتم توليد رقم إلكتروني فريد تلقائياً
4. يمكن عرض وإدارة جميع المعاملات

## 🔗 API Endpoints

### 🏢 إدارة الشركات | Company Management
```bash
# تسجيل شركة جديدة | Register new company
curl -X POST http://localhost:3000/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "شركة التقنية المتطورة",
    "email": "info@techcompany.com",
    "adminName": "أحمد محمد",
    "adminEmail": "admin@techcompany.com"
  }'

# جلب الشركات المتاحة | Get accessible companies
curl -X GET http://localhost:3000/api/auth/accessible-companies

# تغيير سياق الشركة | Set company context
curl -X POST http://localhost:3000/api/auth/set-company-context \
  -H "Content-Type: application/json" \
  -d '{"companyId": 1}'
```

### 💰 المعاملات المالية | Financial Transactions
```bash
# إنشاء معاملة جديدة | Create new transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "sale",
    "amount": 1500.00,
    "description": "بيع منتجات للعميل",
    "transaction_date": "2024-03-29"
  }'

# جلب معاملات الشركة | Get company transactions
curl -X GET http://localhost:3000/api/transactions

# جلب إحصائيات المعاملات | Get transaction statistics
curl -X GET http://localhost:3000/api/transactions/statistics/2024
```

### ⚙️ إدارة النظام | System Administration
```bash
# جلب جميع الشركات مع تفاصيل الاشتراك | Get all companies with subscriptions
curl -X GET http://localhost:3000/api/admin/companies

# تحديث اشتراك شركة | Update company subscription
curl -X PUT http://localhost:3000/api/admin/companies/1/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_plan": "premium",
    "duration_months": 12
  }'

# إحصائيات النظام | System statistics
curl -X GET http://localhost:3000/api/admin/statistics
```

## 🏗 البنية التقنية | Technical Structure

```
├── server.js                    # الخادم الرئيسي | Main server
├── database.js                  # إدارة قاعدة البيانات | Database management
├── userService.js               # خدمات المستخدمين | User services
├── companyService.js            # خدمات الشركات | Company services
├── authService.js               # خدمات المصادقة | Authentication services
├── transactionService.js        # خدمات المعاملات | Transaction services
├── adminService.js              # خدمات الإدارة | Admin services
├── companyMiddleware.js         # وسطاء عزل الشركات | Company isolation middleware
├── public/index.html            # الواجهة الأمامية | Frontend interface
├── MULTI_TENANT_GUIDE.md       # دليل النظام متعدد الشركات | Multi-tenant guide
└── users.db                     # قاعدة البيانات | Database file
```

## 🎯 الجداول الجديدة | New Database Tables

### 📊 جداول النظام متعدد الشركات
- **companies**: محسن مع حقول إدارة الاشتراكات
- **users**: محسن مع إمكانيات الوصول المتعدد
- **user_company_access**: صلاحيات المستخدمين للشركات المتعددة
- **transaction_counters**: عدادات الأرقام الإلكترونية
- **transactions**: المعاملات المالية مع عزل الشركات
- **accounts**: دليل الحسابات مع فصل الشركات
- **admin_logs**: سجلات نشاط المديرين

## 🧪 الاختبار | Testing

### تشغيل الاختبارات | Run Tests
```bash
npm test
```

### النتائج | Results
- ✅ 22/22 اختبار ناجح | All tests passing
- ✅ عزل البيانات متحقق | Data isolation verified
- ✅ الترقيم الإلكتروني يعمل | Electronic numbering working
- ✅ إدارة الاشتراكات فعالة | Subscription management functional

## 📈 الميزات المتقدمة | Advanced Features

### 🔄 **تبديل سياق الشركة**
- تغيير الشركة دون تسجيل خروج
- حفظ السياق في الجلسة
- تحديث البيانات تلقائياً

### 📊 **إحصائيات متقدمة**
- استخدام الموارد لكل شركة
- إحصائيات المعاملات المالية
- تقارير النشاط والأداء

### 🛡 **أمان متعدد المستويات**
- عزل البيانات على مستوى قاعدة البيانات
- تحكم في الوصول على مستوى التطبيق
- مصادقة آمنة على مستوى API

## 🚀 التطوير المستقبلي | Future Development

### 📱 **التوسعات المخططة**
- تطبيق جوال
- دمج أنظمة دفع
- تقارير ذكية بالذكاء الاصطناعي
- دعم العملات المتعددة

### ☁️ **النشر السحابي**
- دعم AWS/Azure/GCP
- توسع أفقي تلقائي
- نسخ احتياطية آلية
- مراقبة متقدمة

## 📞 الدعم والمساهمة | Support & Contributing

### 💬 **طرق التواصل**
- GitHub Issues لتقارير الأخطاء
- Discussions للاقتراحات
- Wiki للوثائق المتقدمة

### 🤝 **المساهمة**
1. Fork المشروع
2. إنشاء branch جديد
3. تطبيق التغييرات
4. إرسال Pull Request

## 📄 الترخيص | License

هذا المشروع مرخص تحت رخصة MIT - انظر ملف LICENSE للتفاصيل.

This project is licensed under the MIT License - see the LICENSE file for details.

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