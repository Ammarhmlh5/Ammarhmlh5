const Database = require('./database');

class AdminService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Subscription Plans
  getSubscriptionPlans() {
    return {
      basic: {
        name: 'الباقة الأساسية',
        max_users: 10,
        max_storage_mb: 1000,
        features: ['إدارة المستخدمين', 'المعاملات الأساسية', 'التقارير البسيطة'],
        price_monthly: 100,
        price_yearly: 1000
      },
      standard: {
        name: 'الباقة المعيارية',
        max_users: 50,
        max_storage_mb: 5000,
        features: ['إدارة المستخدمين', 'المعاملات المتقدمة', 'التقارير التفصيلية', 'النسخ الاحتياطي'],
        price_monthly: 250,
        price_yearly: 2500
      },
      premium: {
        name: 'الباقة المتميزة',
        max_users: 200,
        max_storage_mb: 20000,
        features: ['جميع الميزات', 'API متقدم', 'تكامل خارجي', 'دعم مخصص'],
        price_monthly: 500,
        price_yearly: 5000
      },
      enterprise: {
        name: 'باقة المؤسسات',
        max_users: -1, // Unlimited
        max_storage_mb: -1, // Unlimited
        features: ['جميع الميزات', 'تخصيص كامل', 'دعم مخصص 24/7', 'تدريب فريق العمل'],
        price_monthly: 1000,
        price_yearly: 10000
      }
    };
  }

  // Get all companies with subscription details
  async getAllCompaniesWithSubscriptions() {
    try {
      const companies = await this.database.getAllCompanies();
      const plans = this.getSubscriptionPlans();
      
      // Add subscription plan details and usage stats
      const companiesWithDetails = await Promise.all(
        companies.companies.map(async (company) => {
          const stats = await this.database.getCompanyUsageStats(company.id);
          const plan = plans[company.subscription_plan] || plans.basic;
          
          return {
            ...company,
            subscription_plan_details: plan,
            usage_stats: stats,
            usage_percentage: {
              users: plan.max_users === -1 ? 0 : Math.round((stats.userCount / plan.max_users) * 100),
              storage: plan.max_storage_mb === -1 ? 0 : Math.round((0 / plan.max_storage_mb) * 100) // TODO: Calculate actual storage usage
            }
          };
        })
      );

      return {
        success: true,
        companies: companiesWithDetails,
        total_companies: companiesWithDetails.length
      };
    } catch (error) {
      console.error('خطأ في جلب الشركات مع تفاصيل الاشتراك:', error.message);
      return {
        success: false,
        message: 'فشل في جلب بيانات الشركات',
        companies: []
      };
    }
  }

  // Update company subscription
  async updateCompanySubscription(companyId, subscriptionData, adminUserId) {
    try {
      const { subscription_plan, subscription_status, duration_months } = subscriptionData;
      const plans = this.getSubscriptionPlans();
      
      if (!plans[subscription_plan]) {
        throw new Error('خطة الاشتراك غير صالحة');
      }
      
      const plan = plans[subscription_plan];
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + duration_months);
      
      const updateData = {
        subscription_status: subscription_status || 'active',
        subscription_plan: subscription_plan,
        max_users: plan.max_users,
        max_storage_mb: plan.max_storage_mb,
        subscription_expires_at: expiresAt.toISOString()
      };

      const updated = await this.database.updateCompanySubscription(companyId, updateData);
      
      if (updated) {
        // Log admin action
        await this.database.logAdminAction({
          company_id: companyId,
          admin_user_id: adminUserId,
          action_type: 'subscription_update',
          description: `تم تحديث اشتراك الشركة إلى ${plan.name}`,
          affected_user_id: null,
          metadata: updateData
        });

        return {
          success: true,
          message: 'تم تحديث اشتراك الشركة بنجاح',
          subscription: updateData
        };
      } else {
        throw new Error('فشل في تحديث اشتراك الشركة');
      }
    } catch (error) {
      console.error('خطأ في تحديث اشتراك الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في تحديث اشتراك الشركة'
      };
    }
  }

  // Suspend company subscription
  async suspendCompanySubscription(companyId, reason, adminUserId) {
    try {
      const updateData = {
        subscription_status: 'suspended',
        subscription_plan: 'basic', // Downgrade to basic
        max_users: 1, // Allow only admin user
        max_storage_mb: 100,
        subscription_expires_at: new Date().toISOString()
      };

      const updated = await this.database.updateCompanySubscription(companyId, updateData);
      
      if (updated) {
        // Log admin action
        await this.database.logAdminAction({
          company_id: companyId,
          admin_user_id: adminUserId,
          action_type: 'subscription_suspend',
          description: `تم تعليق اشتراك الشركة - السبب: ${reason}`,
          affected_user_id: null,
          metadata: { reason, suspended_at: new Date().toISOString() }
        });

        return {
          success: true,
          message: 'تم تعليق اشتراك الشركة بنجاح'
        };
      } else {
        throw new Error('فشل في تعليق اشتراك الشركة');
      }
    } catch (error) {
      console.error('خطأ في تعليق اشتراك الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في تعليق اشتراك الشركة'
      };
    }
  }

  // Reactivate company subscription
  async reactivateCompanySubscription(companyId, subscriptionPlan, durationMonths, adminUserId) {
    try {
      const plans = this.getSubscriptionPlans();
      
      if (!plans[subscriptionPlan]) {
        throw new Error('خطة الاشتراك غير صالحة');
      }
      
      const plan = plans[subscriptionPlan];
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
      
      const updateData = {
        subscription_status: 'active',
        subscription_plan: subscriptionPlan,
        max_users: plan.max_users,
        max_storage_mb: plan.max_storage_mb,
        subscription_expires_at: expiresAt.toISOString()
      };

      const updated = await this.database.updateCompanySubscription(companyId, updateData);
      
      if (updated) {
        // Log admin action
        await this.database.logAdminAction({
          company_id: companyId,
          admin_user_id: adminUserId,
          action_type: 'subscription_reactivate',
          description: `تم إعادة تفعيل اشتراك الشركة بخطة ${plan.name}`,
          affected_user_id: null,
          metadata: updateData
        });

        return {
          success: true,
          message: 'تم إعادة تفعيل اشتراك الشركة بنجاح',
          subscription: updateData
        };
      } else {
        throw new Error('فشل في إعادة تفعيل اشتراك الشركة');
      }
    } catch (error) {
      console.error('خطأ في إعادة تفعيل اشتراك الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في إعادة تفعيل اشتراك الشركة'
      };
    }
  }

  // Get system-wide statistics
  async getSystemStatistics() {
    try {
      return new Promise((resolve, reject) => {
        const queries = {
          totalCompanies: `SELECT COUNT(*) as count FROM companies`,
          activeCompanies: `SELECT COUNT(*) as count FROM companies WHERE subscription_status = 'active'`,
          suspendedCompanies: `SELECT COUNT(*) as count FROM companies WHERE subscription_status = 'suspended'`,
          totalUsers: `SELECT COUNT(*) as count FROM users WHERE is_active = 1`,
          totalTransactions: `SELECT COUNT(*) as count FROM transactions`,
          companiesByPlan: `SELECT subscription_plan, COUNT(*) as count FROM companies GROUP BY subscription_plan`
        };

        let completed = 0;
        let stats = {};
        
        // Execute single queries
        Object.keys(queries).forEach(key => {
          if (key !== 'companiesByPlan') {
            this.database.db.get(queries[key], [], (err, row) => {
              if (err) {
                console.error(`خطأ في جلب إحصائية ${key}:`, err.message);
                reject(err);
              } else {
                stats[key] = row.count;
                completed++;
                
                if (completed === Object.keys(queries).length) {
                  resolve({
                    success: true,
                    statistics: stats
                  });
                }
              }
            });
          }
        });

        // Execute group by query
        this.database.db.all(queries.companiesByPlan, [], (err, rows) => {
          if (err) {
            console.error('خطأ في جلب إحصائية الخطط:', err.message);
            reject(err);
          } else {
            stats.companiesByPlan = rows.reduce((acc, row) => {
              acc[row.subscription_plan] = row.count;
              return acc;
            }, {});
            completed++;
            
            if (completed === Object.keys(queries).length) {
              resolve({
                success: true,
                statistics: stats
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات النظام:', error.message);
      return {
        success: false,
        message: 'فشل في جلب إحصائيات النظام',
        statistics: {}
      };
    }
  }

  // Get admin activity logs
  async getAdminActivityLogs(limit = 100, offset = 0) {
    try {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT al.*, au.name as admin_name, au.email as admin_email,
                 c.name as company_name, u.name as affected_user_name
          FROM admin_logs al
          LEFT JOIN users au ON al.admin_user_id = au.id
          LEFT JOIN companies c ON al.company_id = c.id
          LEFT JOIN users u ON al.affected_user_id = u.id
          ORDER BY al.created_at DESC
          LIMIT ? OFFSET ?
        `;
        
        this.database.db.all(query, [limit, offset], (err, rows) => {
          if (err) {
            console.error('خطأ في جلب سجلات نشاط المديرين:', err.message);
            reject(err);
          } else {
            resolve({
              success: true,
              logs: rows,
              total: rows.length
            });
          }
        });
      });
    } catch (error) {
      console.error('خطأ في جلب سجلات نشاط المديرين:', error.message);
      return {
        success: false,
        message: 'فشل في جلب سجلات النشاط',
        logs: []
      };
    }
  }

  // Check subscription limits before allowing operations
  async checkSubscriptionLimits(companyId, operation, additionalData = {}) {
    try {
      const company = await this.database.getCompanyById(companyId);
      if (!company.success || !company.company) {
        return {
          allowed: false,
          message: 'الشركة غير موجودة'
        };
      }

      const companyData = company.company;
      
      // Check if subscription is active
      if (companyData.subscription_status !== 'active') {
        return {
          allowed: false,
          message: 'اشتراك الشركة غير مفعل'
        };
      }

      // Check if subscription has expired
      if (companyData.subscription_expires_at && new Date() > new Date(companyData.subscription_expires_at)) {
        return {
          allowed: false,
          message: 'انتهت صلاحية اشتراك الشركة'
        };
      }

      const stats = await this.database.getCompanyUsageStats(companyId);

      switch (operation) {
        case 'add_user':
          if (companyData.max_users !== -1 && stats.userCount >= companyData.max_users) {
            return {
              allowed: false,
              message: `تم الوصول للحد الأقصى من المستخدمين (${companyData.max_users})`
            };
          }
          break;
          
        case 'add_transaction':
          // Could add transaction limits based on plan
          break;
          
        case 'storage_usage':
          // Could check storage limits
          break;
      }

      return {
        allowed: true,
        message: 'العملية مسموحة'
      };
    } catch (error) {
      console.error('خطأ في فحص حدود الاشتراك:', error.message);
      return {
        allowed: false,
        message: 'خطأ في فحص حدود الاشتراك'
      };
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = AdminService;