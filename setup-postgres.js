#!/usr/bin/env node

// PostgreSQL Setup Script
// سكريبت إعداد PostgreSQL

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupPostgreSQL() {
  console.log('🚀 مرحباً بك في سكريپت إعداد PostgreSQL');
  console.log('Welcome to PostgreSQL Setup Script\n');

  // Get database connection details
  const dbHost = await question('أدخل عنوان الخادم (localhost): ') || 'localhost';
  const dbPort = await question('أدخل رقم المنفذ (5432): ') || '5432';
  const dbUser = await question('أدخل اسم المستخدم (postgres): ') || 'postgres';
  const dbPassword = await question('أدخل كلمة المرور: ');
  const dbName = await question('أدخل اسم قاعدة البيانات (user_management_system): ') || 'user_management_system';

  console.log('\n🔄 جاري الاتصال بـ PostgreSQL...');

  try {
    // First, connect to postgres database to create the target database
    const adminPool = new Pool({
      user: dbUser,
      host: dbHost,
      database: 'postgres', // Connect to default postgres database
      password: dbPassword,
      port: parseInt(dbPort),
    });

    // Check if database exists, create if not
    try {
      const dbCheckResult = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (dbCheckResult.rows.length === 0) {
        console.log(`🆕 إنشاء قاعدة البيانات: ${dbName}`);
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
        console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
      } else {
        console.log('ℹ️ قاعدة البيانات موجودة مسبقاً');
      }
    } catch (err) {
      console.log(`⚠️ تحذير: ${err.message}`);
    } finally {
      await adminPool.end();
    }

    // Now connect to the target database and create tables
    const pool = new Pool({
      user: dbUser,
      host: dbHost,
      database: dbName,
      password: dbPassword,
      port: parseInt(dbPort),
    });

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // Read and execute SQL setup file
    const sqlPath = path.join(__dirname, 'postgresql-setup.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('ملف الإعداد postgresql-setup.sql غير موجود');
    }

    console.log('🔄 تنفيذ سكريپت إنشاء الجداول...');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    let createdCount = 0;
    let skippedCount = 0;

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('create table') || 
            statement.toLowerCase().includes('create index') ||
            statement.toLowerCase().includes('create trigger') ||
            statement.toLowerCase().includes('create extension') ||
            statement.toLowerCase().includes('create or replace function')) {
          
          await pool.query(statement);
          createdCount++;
          
          // Extract table/object name for logging
          const match = statement.match(/create\s+(?:table|index|trigger|extension|function)\s+(?:if\s+not\s+exists\s+)?(\w+)/i);
          if (match) {
            console.log(`✅ تم إنشاء: ${match[1]}`);
          }
        } else if (statement.toLowerCase().includes('insert into')) {
          try {
            await pool.query(statement);
            console.log('✅ تم إدراج البيانات التجريبية');
          } catch (err) {
            if (err.message.includes('duplicate') || err.message.includes('already exists')) {
              console.log('ℹ️ البيانات التجريبية موجودة مسبقاً');
            } else {
              console.log(`⚠️ تحذير في إدراج البيانات: ${err.message}`);
            }
          }
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
          skippedCount++;
        } else {
          console.warn(`⚠️ تحذير: ${err.message}`);
        }
      }
    }

    console.log(`\n📊 تقرير الإعداد:`);
    console.log(`✅ تم إنشاء: ${createdCount} كائن`);
    console.log(`ℹ️ تم تخطي: ${skippedCount} كائن (موجود مسبقاً)`);

    // Test the setup
    console.log('\n🧪 اختبار الإعداد...');
    const testResult = await pool.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    const tableCount = testResult.rows[0].table_count;
    
    console.log(`✅ تم العثور على ${tableCount} جدول في قاعدة البيانات`);

    // Create .env file
    const envContent = `# Database Configuration - Generated by setup script
DB_TYPE=postgresql
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Application Configuration
NODE_ENV=development
PORT=3000
SESSION_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ تم إنشاء ملف .env');

    await pool.end();

    console.log('\n🎉 تم الإعداد بنجاح!');
    console.log('يمكنك الآن تشغيل التطبيق باستخدام: npm start');
    console.log('You can now run the application using: npm start');

  } catch (err) {
    console.error('❌ خطأ في الإعداد:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Main execution
if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };