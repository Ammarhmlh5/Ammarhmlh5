// Test multiple subscribers and accounting
const SubscriberService = require('./subscriberService');
const TransactionService = require('./transactionService');

async function testMultipleSubscribers() {
    const subscriberService = new SubscriberService();
    const transactionService = new TransactionService();
    
    try {
        await subscriberService.init();
        await transactionService.init();
        console.log('✅ تم تهيئة الخدمات بنجاح');
        
        // Test data for additional subscribers
        const subscribers = [
            {
                company_id: 16,
                full_name: 'فاطمة سعد الدين',
                address: 'شارع الحرية، حي الجامعة، المدينة',
                phone: '0703456789',
                business_type: 'تجاري',
                meter_system_type: 'ثلاثي الطور',
                tariff_type: 'تجاري',
                tariff_group: 'مجموعة ب',
                id_card_number: '9876543210',
                property_ownership: 'إيجار',
                connection_amount: 300.00,
                created_by: 34
            },
            {
                company_id: 16,
                full_name: 'علي حسن محمود',
                address: 'شارع الصناعة، المنطقة الصناعية، المدينة',
                phone: '0705678901',
                business_type: 'صناعي',
                meter_system_type: 'ثلاثي الطور',
                tariff_type: 'صناعي',
                tariff_group: 'مجموعة ج',
                id_card_number: '5555666677',
                property_ownership: 'ملك',
                connection_amount: 750.25,
                created_by: 34
            }
        ];
        
        console.log('📝 اختبار إضافة مشتركين متعددين...');
        
        for (let i = 0; i < subscribers.length; i++) {
            const result = await subscriberService.createSubscriber(subscribers[i]);
            
            if (result.success) {
                console.log(`✅ تم إضافة المشترك ${i + 2}:`);
                console.log(`   📊 رقم الحساب: ${result.subscriber.account_number}`);
                console.log(`   👤 الاسم: ${result.subscriber.full_name}`);
                console.log(`   💰 مبلغ الربط: ${result.subscriber.connection_amount} دينار`);
                console.log(`   🏢 نوع النشاط: ${result.subscriber.business_type}`);
            } else {
                console.log(`❌ فشل في إضافة المشترك ${i + 2}:`, result.message);
            }
        }
        
        // Test getting all subscribers
        console.log('\n📋 جلب جميع المشتركين في الشركة...');
        const listResult = await subscriberService.getSubscribersByCompany(16);
        
        if (listResult.success) {
            console.log(`✅ إجمالي المشتركين: ${listResult.subscribers.length}`);
            console.log('قائمة المشتركين:');
            listResult.subscribers.forEach((sub, index) => {
                console.log(`  ${index + 1}. ${sub.account_number}: ${sub.full_name} (${sub.business_type}) - ${sub.connection_amount} دينار`);
            });
        }
        
        // Test getting financial transactions
        console.log('\n💰 جلب المعاملات المالية المرتبطة...');
        const transactions = await transactionService.getTransactionsByCompany(16);
        
        if (transactions.success) {
            console.log(`✅ إجمالي المعاملات: ${transactions.transactions.length}`);
            console.log('المعاملات المالية:');
            transactions.transactions.forEach((trans, index) => {
                console.log(`  ${index + 1}. ${trans.electronic_number}: ${trans.transaction_type} - ${trans.amount} دينار`);
                console.log(`      الوصف: ${trans.description}`);
            });
        }
        
    } catch (error) {
        console.error('❌ خطأ في اختبار النظام:', error.message);
    } finally {
        subscriberService.close();
        transactionService.close();
    }
}

// Run the test
testMultipleSubscribers();