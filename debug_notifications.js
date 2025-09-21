const Database = require('./database');

async function debugNotificationData() {
    const database = new Database();
    await database.init();
    
    console.log('🔍 فحص بيانات الإشعارات في قاعدة البيانات...\n');
    
    // Get raw data from database
    database.db.all('SELECT * FROM notification_settings WHERE company_id = 10', (err, rows) => {
        if (err) {
            console.error('خطأ:', err.message);
        } else {
            console.log('📋 إعدادات الإشعارات الخام:');
            rows.forEach(row => {
                console.log(`${row.transaction_type}: channels = "${row.channels}" (type: ${typeof row.channels})`);
            });
        }
        
        // Now test the database method
        console.log('\n📋 اختبار طريقة قاعدة البيانات:');
        database.getNotificationSettingsByCompany(10)
            .then(settings => {
                console.log('✅ نجح استرجاع الإعدادات:');
                settings.forEach(setting => {
                    console.log(`${setting.transaction_type}: channels = ${JSON.stringify(setting.channels)}`);
                });
            })
            .catch(error => {
                console.error('❌ خطأ في استرجاع الإعدادات:', error.message);
            })
            .finally(() => {
                database.close();
            });
    });
}

debugNotificationData().catch(console.error);