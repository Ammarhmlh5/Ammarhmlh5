const NotificationService = require('./notificationService');
const TransactionService = require('./transactionService');
const Database = require('./database');

async function testNotificationSystem() {
    console.log('🚀 بدء اختبار نظام الإشعارات المالية الموحد...\n');

    // Initialize services
    const notificationService = new NotificationService();
    const transactionService = new TransactionService();
    const database = new Database();
    
    await notificationService.init();
    await transactionService.init();
    await database.init();

    try {
        // Test company ID from our previous test
        const companyId = 10;
        const userId = 19; // Manager user

        console.log('📋 Step 1: تهيئة الإعدادات الافتراضية للإشعارات...');
        const initResult = await notificationService.initializeDefaultSettings(companyId, userId);
        console.log(`Result: ${initResult.message}\n`);

        console.log('📋 Step 2: استعراض إعدادات الإشعارات...');
        const settings = await database.getNotificationSettingsByCompany(companyId);
        console.log(`✅ تم العثور على ${settings.length} إعدادات للشركة:`);
        settings.forEach(setting => {
            const channelsStr = Array.isArray(setting.channels) ? setting.channels.join(', ') : setting.channels;
            console.log(`   - ${setting.transaction_type}: ${setting.is_enabled ? 'مفعل' : 'معطل'} | قنوات: ${channelsStr}`);
        });
        console.log('');

        console.log('📋 Step 3: استعراض قوالب الرسائل...');
        const templates = await database.getMessageTemplates(companyId);
        console.log(`✅ تم العثور على ${templates.length} قالب رسالة:`);
        templates.slice(0, 3).forEach(template => {
            console.log(`   - ${template.template_name} (${template.channel})`);
            console.log(`     المحتوى: ${template.content.substring(0, 80)}...`);
        });
        console.log('');

        // Create test subscriber
        console.log('📋 Step 4: إنشاء مشترك تجريبي...');
        const subscriberData = {
            company_id: companyId,
            full_name: 'عبدالله أحمد المحمد',
            address: 'الرياض، حي النهضة',
            phone: '+966501234567',
            business_type: 'سكني',
            connection_amount: 500,
            created_by: userId
        };

        // Get next account number
        const accountNumber = await database.getNextSubscriberAccountNumber(companyId);
        subscriberData.account_number = accountNumber;

        const subscriberId = await database.saveSubscriber(subscriberData);
        console.log(`✅ تم إنشاء المشترك: ${subscriberData.full_name} - رقم الحساب: ${accountNumber}\n`);

        // Get the saved subscriber
        const subscriber = await database.getSubscriberById(subscriberId, companyId);

        console.log('📋 Step 5: إنشاء معاملة مالية واختبار الإشعارات التلقائية...');
        const transactionData = {
            company_id: companyId,
            transaction_type: 'cash_receipt',
            amount: 1500.00,
            description: 'دفعة ربط التيار الكهربائي',
            transaction_date: new Date().toISOString().split('T')[0],
            reference_number: 'REF-001',
            subscriber_id: subscriberId
        };

        const result = await transactionService.createTransaction(transactionData, userId);
        console.log(`✅ تم إنشاء المعاملة: ${result.transaction.electronic_number}\n`);

        console.log('📋 Step 6: استعراض سجلات الإشعارات...');
        // Wait a bit for notifications to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const logs = await database.getNotificationLogsByCompany(companyId, 10, 0);
        console.log(`✅ تم العثور على ${logs.length} سجل إشعار:`);
        logs.forEach(log => {
            console.log(`   - ${log.channel.toUpperCase()} إلى ${log.recipient}`);
            console.log(`     الحالة: ${log.status} | التاريخ: ${new Date(log.created_at).toLocaleString('ar-SA')}`);
            console.log(`     المحتوى: ${log.content.substring(0, 100)}...`);
        });
        console.log('');

        console.log('🎉 تم اختبار النظام بنجاح! ✅');
        console.log('\n📊 ملخص النتائج:');
        console.log(`✅ إعدادات الإشعارات: ${settings.length} نوع معاملة`);
        console.log(`✅ قوالب الرسائل: ${templates.length} قالب`);
        console.log(`✅ المعاملات المنشأة: 1 معاملة`);
        console.log(`✅ الإشعارات المرسلة: ${logs.length} إشعار`);

    } catch (error) {
        console.error('❌ خطأ في اختبار النظام:', error.message);
    } finally {
        // Close connections
        database.close();
        notificationService.close();
        transactionService.close();
    }
}

// Run the test
testNotificationSystem().catch(console.error);