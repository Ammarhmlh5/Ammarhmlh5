// Test subscriber functionality without UI
const SubscriberService = require('./subscriberService');

async function testSubscriberSystem() {
    const subscriberService = new SubscriberService();
    
    try {
        await subscriberService.init();
        console.log('✅ تم تهيئة خدمة المشتركين بنجاح');
        
        // Test data for a new subscriber
        const testSubscriber = {
            company_id: 16, // Using the company we created earlier
            full_name: 'محمد عبدالله أحمد',
            address: 'شارع الأمل، حي النصر، المدينة',
            phone: '0701234567',
            business_type: 'سكني',
            meter_system_type: 'أحادي الطور',
            tariff_type: 'الفئة الأولى',
            tariff_group: 'مجموعة أ',
            id_card_number: '1234567890',
            property_ownership: 'ملك',
            connection_amount: 150.50,
            created_by: 34 // Using the admin user we created
        };
        
        console.log('📝 اختبار إضافة مشترك جديد...');
        const result = await subscriberService.createSubscriber(testSubscriber);
        
        if (result.success) {
            console.log('✅ تم إضافة المشترك بنجاح!');
            console.log(`📊 رقم الحساب: ${result.subscriber.account_number}`);
            console.log(`👤 الاسم: ${result.subscriber.full_name}`);
            console.log(`💰 مبلغ الربط: ${result.subscriber.connection_amount} دينار`);
            
            // Test getting subscribers
            console.log('\n📋 اختبار جلب قائمة المشتركين...');
            const listResult = await subscriberService.getSubscribersByCompany(16);
            
            if (listResult.success) {
                console.log(`✅ تم جلب ${listResult.subscribers.length} مشترك`);
                listResult.subscribers.forEach(sub => {
                    console.log(`  - ${sub.account_number}: ${sub.full_name}`);
                });
            } else {
                console.log('❌ فشل في جلب قائمة المشتركين:', listResult.message);
            }
            
            // Test getting subscriber by account number
            console.log('\n🔍 اختبار البحث برقم الحساب...');
            const searchResult = await subscriberService.getSubscriberByAccountNumber(result.subscriber.account_number, 16);
            
            if (searchResult.success) {
                console.log('✅ تم العثور على المشترك:');
                console.log(`  - الاسم: ${searchResult.subscriber.full_name}`);
                console.log(`  - العنوان: ${searchResult.subscriber.address}`);
                console.log(`  - الهاتف: ${searchResult.subscriber.phone}`);
            } else {
                console.log('❌ لم يتم العثور على المشترك:', searchResult.message);
            }
            
        } else {
            console.log('❌ فشل في إضافة المشترك:', result.message);
        }
        
    } catch (error) {
        console.error('❌ خطأ في اختبار النظام:', error.message);
    } finally {
        subscriberService.close();
    }
}

// Run the test
testSubscriberSystem();