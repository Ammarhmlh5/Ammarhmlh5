# دليل إعداد PostgreSQL | PostgreSQL Setup Guide

## نظرة عامة | Overview

تم إضافة دعم شامل لقاعدة بيانات PostgreSQL إلى النظام مع الحفاظ على التوافق مع SQLite. يوفر PostgreSQL أداءً فائقاً وقابلية توسع أفضل للتطبيقات الإنتاجية.

This system now includes comprehensive PostgreSQL support while maintaining SQLite compatibility. PostgreSQL provides superior performance and better scalability for production applications.

## 🚀 المتطلبات | Requirements

### PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download and install from: https://www.postgresql.org/download/windows/
```

### Node.js Dependencies
```bash
npm install pg
```

## 🛠 طرق الإعداد | Setup Methods

### الطريقة الأولى: الإعداد التلقائي (موصى به) | Method 1: Automatic Setup (Recommended)

```bash
# تشغيل سكريپت الإعداد التلقائي
npm run setup-postgres

# أو
node setup-postgres.js
```

سيقوم السكريپت بـ:
- إنشاء قاعدة البيانات تلقائياً
- إنشاء جميع الجداول والفهارس
- إعداد ملف .env
- اختبار الاتصال

The script will:
- Automatically create the database
- Create all tables and indexes
- Set up .env file
- Test the connection

### الطريقة الثانية: الإعداد اليدوي | Method 2: Manual Setup

#### 1. إنشاء قاعدة البيانات | Create Database
```sql
-- الاتصال بـ PostgreSQL
psql -U postgres

-- إنشاء قاعدة البيانات
CREATE DATABASE user_management_system;

-- إنشاء مستخدم (اختياري)
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE user_management_system TO app_user;

-- الخروج والاتصال بالقاعدة الجديدة
\q
psql -U postgres -d user_management_system
```

#### 2. تنفيذ سكريپت الجداول | Execute Table Script
```bash
# تنفيذ ملف الإعداد
psql -U postgres -d user_management_system -f postgresql-setup.sql
```

#### 3. إعداد ملف البيئة | Setup Environment File
```bash
# نسخ ملف المثال
cp .env.example .env

# تحرير الملف وإضافة بيانات الاتصال
nano .env
```

## ⚙️ تكوين البيئة | Environment Configuration

إنشاء ملف `.env` مع المعاملات التالية:

```env
# نوع قاعدة البيانات
DB_TYPE=postgresql

# معلومات الاتصال بـ PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_management_system
DB_USER=postgres
DB_PASSWORD=your_password

# إعدادات التطبيق
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-session-secret
```

## 🏗 هيكل قاعدة البيانات | Database Structure

### الجداول الرئيسية | Main Tables

| الجدول | الوصف | Description |
|--------|--------|-------------|
| `companies` | معلومات الشركات والاشتراكات | Company information and subscriptions |
| `users` | المستخدمين والصلاحيات | Users and permissions |
| `user_company_access` | الوصول متعدد الشركات | Multi-company access |
| `transaction_counters` | عدادات الأرقام الإلكترونية | Electronic number counters |
| `transactions` | المعاملات المالية | Financial transactions |
| `accounts` | دليل الحسابات | Chart of accounts |
| `subscribers` | المشتركين | Subscribers/customers |
| `admin_logs` | سجلات المدير | Admin activity logs |
| `notification_settings` | إعدادات الإشعارات | Notification settings |
| `message_templates` | قوالب الرسائل | Message templates |
| `notification_logs` | سجلات الإشعارات | Notification delivery logs |

### المميزات المضافة | Added Features

#### 1. تحسينات PostgreSQL
- **SERIAL** بدلاً من AUTOINCREMENT
- **CITEXT** للبريد الإلكتروني (case-insensitive)
- **JSONB** للبيانات المنظمة
- **CHECK constraints** للتحقق من القيم
- **Foreign Key constraints** مع ON DELETE actions

#### 2. الفهارس المحسنة | Optimized Indexes
- فهارس على الأعمدة المستخدمة بكثرة
- فهارس مركبة للاستعلامات المعقدة
- فهارس على التواريخ والأنواع

#### 3. الوظائف التلقائية | Automatic Functions
- تحديث `updated_at` تلقائياً
- محفزات لضمان سلامة البيانات

## 🧪 اختبار الإعداد | Testing Setup

### فحص صحة قاعدة البيانات | Database Health Check
```bash
npm run db-health
```

### اختبار الاتصال يدوياً | Manual Connection Test
```javascript
// test-connection.js
const databaseConfig = require('./database-config');

async function test() {
  try {
    await databaseConfig.init();
    const health = await databaseConfig.healthCheck();
    console.log('✅ Database Health:', health);
    
    const db = databaseConfig.getDatabase();
    const companies = await db.getAllCompanies();
    console.log('📊 Companies count:', companies.length);
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
```

## 🔄 الترحيل من SQLite | Migration from SQLite

### 1. نسخ احتياطي من SQLite
```bash
# إنشاء نسخة احتياطية
cp users.db users_backup.db
```

### 2. تصدير البيانات (اختياري)
```bash
# يمكن إنشاء سكريپت ترحيل مخصص حسب الحاجة
# Custom migration script can be created as needed
```

### 3. تبديل نوع قاعدة البيانات
```bash
# تحديث ملف .env
echo "DB_TYPE=postgresql" >> .env
```

## 🔧 استكشاف الأخطاء | Troubleshooting

### مشاكل الاتصال | Connection Issues

#### خطأ: "database does not exist"
```bash
# إنشاء قاعدة البيانات يدوياً
createdb -U postgres user_management_system
```

#### خطأ: "authentication failed"
```bash
# التحقق من إعدادات PostgreSQL
sudo nano /etc/postgresql/*/main/pg_hba.conf

# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

#### خطأ: "connection refused"
```bash
# التحقق من تشغيل الخدمة
sudo systemctl status postgresql

# بدء الخدمة
sudo systemctl start postgresql
```

### مشاكل الأداء | Performance Issues

#### تحسين الاستعلامات
```sql
-- عرض الاستعلامات البطيئة
EXPLAIN ANALYZE SELECT * FROM transactions WHERE company_id = 1;

-- إنشاء فهرس إضافي
CREATE INDEX idx_custom_field ON table_name(field_name);
```

## 📊 مراقبة الأداء | Performance Monitoring

### استعلامات مفيدة | Useful Queries

```sql
-- حجم قاعدة البيانات
SELECT pg_size_pretty(pg_database_size('user_management_system'));

-- حجم الجداول
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;

-- الاستعلامات النشطة
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

## 🔒 الأمان | Security

### أفضل الممارسات | Best Practices

1. **كلمات المرور القوية**
   ```sql
   ALTER USER postgres PASSWORD 'very_strong_password';
   ```

2. **تقييد الوصول**
   ```sql
   -- إنشاء مستخدم محدود الصلاحيات
   CREATE USER app_readonly WITH PASSWORD 'readonly_pass';
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
   ```

3. **النسخ الاحتياطية المنتظمة**
   ```bash
   # نسخة احتياطية يومية
   pg_dump -U postgres user_management_system > backup_$(date +%Y%m%d).sql
   ```

## 📈 التحسينات المستقبلية | Future Enhancements

- [ ] Read Replicas للقراءة
- [ ] Connection Pooling متقدم
- [ ] Partitioning للجداول الكبيرة
- [ ] Full-text search
- [ ] Real-time notifications
- [ ] Automated backups
- [ ] Performance analytics

## 📞 المساعدة | Support

للحصول على المساعدة:
- راجع ملف README.md الرئيسي
- تحقق من سجلات الأخطاء في التطبيق
- استخدم GitHub Issues للإبلاغ عن المشاكل

For support:
- Check the main README.md file
- Review application error logs
- Use GitHub Issues to report problems

---

## 🎯 ملخص سريع | Quick Summary

```bash
# 1. تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib

# 2. تشغيل الإعداد التلقائي
npm run setup-postgres

# 3. تشغيل التطبيق
npm start

# 4. فحص الصحة
npm run db-health
```

**تم إنشاء قاعدة بيانات PostgreSQL محسنة وجاهزة للإنتاج! 🚀**

**Optimized PostgreSQL database created and ready for production! 🚀**