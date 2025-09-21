const Database = require('./database');

class NotificationService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Default message templates for different transaction types
  getDefaultTemplates() {
    return {
      'sales': {
        sms: {
          content: 'عزيزي {subscriber_name}، تم تسجيل معاملة بيع برقم {electronic_number} بمبلغ {amount} ريال. شكراً لتعاملكم معنا.',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        whatsapp: {
          content: 'السلام عليكم {subscriber_name}\n\nتم تسجيل معاملة بيع جديدة:\n📄 الرقم الإلكتروني: {electronic_number}\n💰 المبلغ: {amount} ريال\n📅 التاريخ: {date}\n\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        email: {
          subject: 'إشعار معاملة بيع - {electronic_number}',
          content: 'عزيزي/عزيزتي {subscriber_name},\n\nنود إعلامكم بأنه تم تسجيل معاملة بيع جديدة:\n\nالرقم الإلكتروني: {electronic_number}\nنوع المعاملة: مبيعات\nالمبلغ: {amount} ريال\nالوصف: {description}\nالتاريخ: {date}\n\nمع تحيات,\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'description', 'company_name', 'date']
        }
      },
      'purchase': {
        sms: {
          content: 'عزيزي {subscriber_name}، تم تسجيل معاملة شراء برقم {electronic_number} بمبلغ {amount} ريال.',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        whatsapp: {
          content: 'السلام عليكم {subscriber_name}\n\nتم تسجيل معاملة شراء:\n📄 الرقم الإلكتروني: {electronic_number}\n💰 المبلغ: {amount} ريال\n📅 التاريخ: {date}\n\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        email: {
          subject: 'إشعار معاملة شراء - {electronic_number}',
          content: 'عزيزي/عزيزتي {subscriber_name},\n\nتم تسجيل معاملة شراء:\n\nالرقم الإلكتروني: {electronic_number}\nنوع المعاملة: مشتريات\nالمبلغ: {amount} ريال\nالوصف: {description}\nالتاريخ: {date}\n\nمع تحيات,\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'description', 'company_name', 'date']
        }
      },
      'cash_receipt': {
        sms: {
          content: 'تم استلام دفعة بمبلغ {amount} ريال برقم {electronic_number}. شكراً لكم.',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        whatsapp: {
          content: 'السلام عليكم {subscriber_name}\n\n✅ تم استلام الدفعة بنجاح:\n📄 رقم الإيصال: {electronic_number}\n💰 المبلغ: {amount} ريال\n📅 التاريخ: {date}\n\nشكراً لكم - {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        email: {
          subject: 'إيصال استلام دفعة - {electronic_number}',
          content: 'عزيزي/عزيزتي {subscriber_name},\n\nتم استلام دفعة بنجاح:\n\nرقم الإيصال: {electronic_number}\nالمبلغ المستلم: {amount} ريال\nالوصف: {description}\nتاريخ الاستلام: {date}\n\nشكراً لتعاملكم معنا,\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'description', 'company_name', 'date']
        }
      },
      'journal_entry': {
        sms: {
          content: 'تم تسجيل قيد يومي برقم {electronic_number} بمبلغ {amount} ريال.',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        whatsapp: {
          content: 'تم تسجيل قيد يومي:\n📄 الرقم: {electronic_number}\n💰 المبلغ: {amount} ريال\n📅 التاريخ: {date}\n\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'company_name', 'date']
        },
        email: {
          subject: 'قيد يومي - {electronic_number}',
          content: 'تم تسجيل قيد يومي جديد:\n\nالرقم الإلكتروني: {electronic_number}\nالمبلغ: {amount} ريال\nالوصف: {description}\nالتاريخ: {date}\n\nشركة {company_name}',
          variables: ['subscriber_name', 'electronic_number', 'amount', 'description', 'company_name', 'date']
        }
      }
    };
  }

  // Get notification settings for a transaction type
  async getNotificationSettings(companyId, transactionType) {
    try {
      const settings = await this.database.getNotificationSettingsByCompany(companyId);
      return settings.find(s => s.transaction_type === transactionType);
    } catch (error) {
      console.error('خطأ في جلب إعدادات الإشعارات:', error.message);
      return null;
    }
  }

  // Process template variables
  processTemplate(template, variables) {
    let processedContent = template.content;
    let processedSubject = template.subject || '';

    // Replace variables in content
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), variables[key] || '');
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });

    return {
      content: processedContent,
      subject: processedSubject
    };
  }

  // Send notification (stub implementation - would integrate with actual SMS/WhatsApp/Email services)
  async sendNotification(channel, recipient, subject, content) {
    // This is a stub implementation
    // In a real system, you would integrate with:
    // - SMS: Twilio, AWS SNS, local SMS gateway
    // - WhatsApp: WhatsApp Business API
    // - Email: SendGrid, AWS SES, nodemailer
    
    console.log(`📲 إرسال إشعار ${channel} إلى ${recipient}`);
    console.log(`الموضوع: ${subject}`);
    console.log(`المحتوى: ${content}`);
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      console.log('✅ تم إرسال الإشعار بنجاح');
      return { success: true, messageId: `msg_${Date.now()}` };
    } else {
      console.log('❌ فشل في إرسال الإشعار');
      return { success: false, error: 'خطأ في الاتصال بخدمة الإرسال' };
    }
  }

  // Send financial transaction notification
  async sendTransactionNotification(transactionData, companyData, subscriberData = null) {
    try {
      // Get notification settings for this transaction type
      const settings = await this.getNotificationSettings(companyData.id, transactionData.transaction_type);
      
      if (!settings || !settings.is_enabled || !settings.auto_send) {
        console.log('الإشعارات غير مفعلة لهذا النوع من المعاملات');
        return { success: false, message: 'الإشعارات غير مفعلة' };
      }

      const channels = settings.channels || ['sms'];
      const results = [];

      // Get message templates
      const templates = await this.database.getMessageTemplates(
        companyData.id, 
        transactionData.transaction_type
      );

      // Prepare template variables
      const variables = {
        subscriber_name: subscriberData ? subscriberData.full_name : 'العميل',
        account_number: subscriberData ? subscriberData.account_number : '',
        electronic_number: transactionData.electronic_number,
        amount: parseFloat(transactionData.amount).toLocaleString(),
        description: transactionData.description,
        company_name: companyData.name,
        date: new Date(transactionData.transaction_date).toLocaleDateString('ar-SA'),
        transaction_type: this.getTransactionTypeArabic(transactionData.transaction_type)
      };

      // Send to subscriber if enabled and subscriber data exists
      if (settings.send_to_subscriber && subscriberData) {
        for (const channel of channels) {
          await this.sendNotificationToRecipient(
            channel, 
            subscriberData, 
            transactionData, 
            companyData, 
            templates, 
            variables, 
            'subscriber'
          );
        }
      }

      // Send to company if enabled
      if (settings.send_to_company) {
        for (const channel of channels) {
          await this.sendNotificationToRecipient(
            channel, 
            { phone: companyData.phone, email: companyData.email, full_name: companyData.name }, 
            transactionData, 
            companyData, 
            templates, 
            variables, 
            'company'
          );
        }
      }

      return { success: true, message: 'تم إرسال الإشعارات بنجاح' };

    } catch (error) {
      console.error('خطأ في إرسال إشعار المعاملة المالية:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Send notification to a specific recipient
  async sendNotificationToRecipient(channel, recipient, transactionData, companyData, templates, variables, recipientType) {
    try {
      // Find template for this channel
      let template = templates.find(t => t.channel === channel);
      
      // If no custom template, use default
      if (!template) {
        const defaultTemplates = this.getDefaultTemplates();
        template = defaultTemplates[transactionData.transaction_type] ? 
          defaultTemplates[transactionData.transaction_type][channel] : null;
      }

      if (!template) {
        console.log(`لا يوجد قالب رسالة لقناة ${channel} ونوع المعاملة ${transactionData.transaction_type}`);
        return;
      }

      // Process template
      const processedTemplate = this.processTemplate(template, variables);

      // Determine recipient contact
      let recipientContact = '';
      if (channel === 'sms' || channel === 'whatsapp') {
        recipientContact = recipient.phone;
      } else if (channel === 'email') {
        recipientContact = recipient.email;
      }

      if (!recipientContact) {
        console.log(`لا يوجد ${channel} للمستلم ${recipient.full_name}`);
        return;
      }

      // Log notification attempt
      const logId = await this.database.logNotification({
        company_id: companyData.id,
        transaction_id: transactionData.id,
        subscriber_id: recipientType === 'subscriber' ? recipient.id : null,
        template_id: template.id || null,
        channel: channel,
        recipient: recipientContact,
        subject: processedTemplate.subject,
        content: processedTemplate.content,
        status: 'pending'
      });

      // Send notification
      const result = await this.sendNotification(
        channel, 
        recipientContact, 
        processedTemplate.subject, 
        processedTemplate.content
      );

      // Update status
      if (result.success) {
        await this.database.updateNotificationStatus(logId, 'sent');
      } else {
        await this.database.updateNotificationStatus(logId, 'failed', result.error);
      }

      return result;

    } catch (error) {
      console.error('خطأ في إرسال الإشعار للمستلم:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get Arabic translation for transaction types
  getTransactionTypeArabic(type) {
    const translations = {
      'sales': 'مبيعات',
      'purchase': 'مشتريات', 
      'cash_receipt': 'إيصال نقدي',
      'journal_entry': 'قيد يومي'
    };
    return translations[type] || type;
  }

  // Initialize default notification settings for a company
  async initializeDefaultSettings(companyId, userId) {
    try {
      const transactionTypes = ['sales', 'purchase', 'cash_receipt', 'journal_entry'];
      
      for (const type of transactionTypes) {
        await this.database.saveNotificationSettings({
          company_id: companyId,
          transaction_type: type,
          is_enabled: true,
          channels: ['sms'],
          send_to_subscriber: true,
          send_to_company: false,
          auto_send: true,
          created_by: userId
        });

        // Create default templates
        const defaultTemplates = this.getDefaultTemplates();
        if (defaultTemplates[type]) {
          for (const [channel, templateData] of Object.entries(defaultTemplates[type])) {
            await this.database.saveMessageTemplate({
              company_id: companyId,
              transaction_type: type,
              channel: channel,
              template_name: `قالب ${this.getTransactionTypeArabic(type)} - ${channel.toUpperCase()}`,
              subject: templateData.subject || '',
              content: templateData.content,
              variables: templateData.variables,
              is_default: true,
              is_active: true,
              created_by: userId
            });
          }
        }
      }

      return { success: true, message: 'تم تهيئة الإعدادات الافتراضية بنجاح' };
    } catch (error) {
      console.error('خطأ في تهيئة الإعدادات الافتراضية:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Close database connection
  close() {
    if (this.database) {
      this.database.close();
    }
  }
}

module.exports = NotificationService;