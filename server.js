const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const Database = require('./database');
const UserService = require('./userService');
const CompanyService = require('./companyService');
const AuthService = require('./authService');
const TransactionService = require('./transactionService');
const AdminService = require('./adminService');
const SubscriberService = require('./subscriberService');
const NotificationService = require('./notificationService');
const CompanyMiddleware = require('./companyMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a shared database instance
const sharedDatabase = new Database();

// Initialize services with shared database
const userService = new UserService();
const companyService = new CompanyService();
const authService = new AuthService();
const transactionService = new TransactionService();
const adminService = new AdminService();
const subscriberService = new SubscriberService();
const notificationService = new NotificationService();
const companyMiddleware = new CompanyMiddleware();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'user-management-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files with enhanced cache control headers to prevent caching issues
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Enhanced cache prevention for HTML files with additional headers
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Last-Modified', new Date().toUTCString());
      res.setHeader('ETag', `"${Date.now()}"`);
      res.setHeader('Vary', 'User-Agent');
      res.setHeader('X-Version', '1.0.2');
      res.setHeader('X-Deployment-Time', new Date().toISOString());
    }
    // Enhanced short-term caching for assets with forced revalidation
    else if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Last-Modified', new Date().toUTCString());
      res.setHeader('ETag', `"${Date.now()}"`);
    }
    // Images can be cached for a short time
    else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  }
}));

// Routes

// Serve the main page with enhanced cache prevention
app.get('/', (req, res) => {
  // Set enhanced headers to prevent caching for the main page
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Last-Modified', new Date().toUTCString());
  res.setHeader('ETag', `"main-${Date.now()}"`);
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('X-Version', '1.0.2');
  res.setHeader('X-Deployment-Time', new Date().toISOString());
  res.setHeader('X-Cache-Status', 'BYPASS');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes

// Register a new company with admin user
app.post('/api/companies/register', async (req, res) => {
  try {
    console.log('طلب تسجيل شركة جديدة:', req.body);
    
    const result = await companyService.registerCompany(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('خطأ في API تسجيل الشركة:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      company: null,
      admin: null
    });
  }
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const result = await companyService.getAllCompanies();
    res.json(result);
  } catch (error) {
    console.error('خطأ في API جلب الشركات:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      companies: []
    });
  }
});

// Get company by ID
app.get('/api/companies/:id', async (req, res) => {
  try {
    const result = await companyService.getCompanyById(req.params.id);
    
    if (result.success) {
      res.json(result);
    } else if (result.message === 'الشركة غير موجودة') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('خطأ في API جلب الشركة:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      company: null
    });
  }
});

// Get users by company
app.get('/api/companies/:id/users', async (req, res) => {
  try {
    const result = await companyService.getUsersByCompany(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('خطأ في API جلب مستخدمي الشركة:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      users: []
    });
  }
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    console.log('طلب إنشاء مستخدم جديد:', req.body);
    
    const result = await userService.createUser(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('خطأ في API إنشاء المستخدم:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      user: null
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    res.json(result);
  } catch (error) {
    console.error('خطأ في API جلب المستخدمين:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      users: []
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);
    
    if (result.success) {
      res.json(result);
    } else if (result.message === 'المستخدم غير موجود') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('خطأ في API جلب المستخدم:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      user: null
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('طلب تسجيل دخول:', { email });
    
    const result = await authService.login(email, password);
    
    if (result.success) {
      req.session.user = result.user;
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('خطأ في API تسجيل الدخول:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('خطأ في تسجيل الخروج:', err);
      res.status(500).json({
        success: false,
        message: 'فشل في تسجيل الخروج'
      });
    } else {
      res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    }
  });
});

// Get current user session
app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'غير مسجل الدخول'
    });
  }
});

// Set password
app.post('/api/auth/set-password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    console.log('طلب تعيين كلمة مرور للمستخدم:', userId);
    
    const result = await authService.setPassword(userId, password);
    res.json(result);
  } catch (error) {
    console.error('خطأ في API تعيين كلمة المرور:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    const { currentPassword, newPassword } = req.body;
    console.log('طلب تغيير كلمة مرور للمستخدم:', req.session.user.id);
    
    const result = await authService.changePassword(req.session.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error('خطأ في API تغيير كلمة المرور:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('طلب استرداد كلمة مرور للبريد:', email);
    
    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('خطأ في API طلب استرداد كلمة المرور:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log('طلب إعادة تعيين كلمة مرور برمز:', token);
    
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    console.error('خطأ في API إعادة تعيين كلمة المرور:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
});

// Company Context Routes

// Set company context for user session
app.post('/api/auth/set-company-context', companyMiddleware.setCompanyContext.bind(companyMiddleware));

// Get user's accessible companies
app.get('/api/auth/accessible-companies', companyMiddleware.requireAuth(), async (req, res) => {
  try {
    const companies = await companyMiddleware.database.getUserAccessibleCompanies(req.session.user.id);
    res.json({
      success: true,
      companies: companies
    });
  } catch (error) {
    console.error('خطأ في جلب الشركات المتاحة:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الشركات المتاحة',
      companies: []
    });
  }
});

// Transaction Routes

// Create transaction
app.post('/api/transactions', 
  companyMiddleware.requireAuth(), 
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      // Check subscription limits
      const limitCheck = await adminService.checkSubscriptionLimits(req.companyId, 'add_transaction');
      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: limitCheck.message
        });
      }

      const result = await transactionService.createTransaction(req.body, req.session.user.id);
      
      if (result.success) {
        // Log admin action if user is admin
        if (req.session.user.role === 'admin') {
          await companyMiddleware.logAction(
            req.session.user.id,
            req.companyId,
            'transaction_create',
            `تم إنشاء معاملة جديدة: ${result.transaction.electronic_number}`,
            null,
            { transaction_id: result.transaction.id }
          );
        }
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('خطأ في API إنشاء المعاملة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Get company transactions
app.get('/api/transactions', 
  companyMiddleware.requireAuth(), 
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await transactionService.getTransactionsByCompany(req.companyId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API جلب المعاملات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        transactions: []
      });
    }
  }
);

// Get transaction by electronic number
app.get('/api/transactions/:electronicNumber', 
  companyMiddleware.requireAuth(), 
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await transactionService.getTransactionByElectronicNumber(req.companyId, req.params.electronicNumber);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('خطأ في API جلب المعاملة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        transaction: null
      });
    }
  }
);

// Get transaction statistics
app.get('/api/transactions/statistics/:year?', 
  companyMiddleware.requireAuth(), 
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const year = req.params.year ? parseInt(req.params.year) : null;
      const result = await transactionService.getTransactionStatistics(req.companyId, year);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API إحصائيات المعاملات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        statistics: {}
      });
    }
  }
);

// Get transaction types
app.get('/api/transactions/types', (req, res) => {
  const types = transactionService.getTransactionTypes();
  res.json({
    success: true,
    transaction_types: types
  });
});

// Admin Routes (System Administrator only)

// Get all companies with subscription details
app.get('/api/admin/companies', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const result = await adminService.getAllCompaniesWithSubscriptions();
      res.json(result);
    } catch (error) {
      console.error('خطأ في API جلب شركات المدير:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        companies: []
      });
    }
  }
);

// Update company subscription
app.put('/api/admin/companies/:id/subscription', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const result = await adminService.updateCompanySubscription(req.params.id, req.body, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API تحديث اشتراك الشركة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Suspend company subscription
app.post('/api/admin/companies/:id/suspend', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const result = await adminService.suspendCompanySubscription(req.params.id, reason, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API تعليق اشتراك الشركة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Reactivate company subscription
app.post('/api/admin/companies/:id/reactivate', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const { subscription_plan, duration_months } = req.body;
      const result = await adminService.reactivateCompanySubscription(req.params.id, subscription_plan, duration_months, req.session.user.id);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API إعادة تفعيل اشتراك الشركة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Get system statistics
app.get('/api/admin/statistics', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const result = await adminService.getSystemStatistics();
      res.json(result);
    } catch (error) {
      console.error('خطأ في API إحصائيات النظام:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        statistics: {}
      });
    }
  }
);

// Get admin activity logs
app.get('/api/admin/logs', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireSystemAdmin(),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      const result = await adminService.getAdminActivityLogs(limit, offset);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API سجلات نشاط المديرين:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        logs: []
      });
    }
  }
);

// Get subscription plans
app.get('/api/admin/subscription-plans', (req, res) => {
  const plans = adminService.getSubscriptionPlans();
  res.json({
    success: true,
    plans: plans
  });
});

// Subscriber Management API Routes

// Create a new subscriber
app.post('/api/subscribers', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      console.log('طلب إضافة مشترك جديد:', req.body);
      
      // Add company ID and creator ID from session
      const subscriberData = {
        ...req.body,
        company_id: req.session.current_company_id,
        created_by: req.session.user.id
      };
      
      const result = await subscriberService.createSubscriber(subscriberData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('خطأ في API إضافة المشترك:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        subscriber: null
      });
    }
  }
);

// Get all subscribers for current company
app.get('/api/subscribers', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const result = await subscriberService.getSubscribersByCompany(req.session.current_company_id, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API جلب المشتركين:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        subscribers: []
      });
    }
  }
);

// Get subscriber by ID
app.get('/api/subscribers/:id', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await subscriberService.getSubscriberById(req.params.id, req.session.current_company_id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('خطأ في API جلب بيانات المشترك:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        subscriber: null
      });
    }
  }
);

// Get subscriber by account number
app.get('/api/subscribers/account/:accountNumber', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await subscriberService.getSubscriberByAccountNumber(req.params.accountNumber, req.session.current_company_id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('خطأ في API جلب بيانات المشترك:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        subscriber: null
      });
    }
  }
);

// Update subscriber
app.put('/api/subscribers/:id', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await subscriberService.updateSubscriber(req.params.id, req.session.current_company_id, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('خطأ في API تحديث بيانات المشترك:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Deactivate subscriber
app.delete('/api/subscribers/:id', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await subscriberService.deactivateSubscriber(req.params.id, req.session.current_company_id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('خطأ في API إلغاء تفعيل المشترك:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Get users for payment assignment dropdown
app.get('/api/subscribers/users-for-payment', 
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const result = await subscriberService.getUsersForPaymentAssignment(req.session.current_company_id);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API جلب المستخدمين للدفع:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Notification API Endpoints

// Get notification settings by company
app.get('/api/notifications/settings',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const settings = await notificationService.database.getNotificationSettingsByCompany(companyId);
      
      res.json({
        success: true,
        message: 'تم جلب إعدادات الإشعارات بنجاح',
        settings: settings
      });
    } catch (error) {
      console.error('خطأ في API جلب إعدادات الإشعارات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Initialize default notification settings
app.post('/api/notifications/initialize',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const userId = req.session.user_id;
      
      const result = await notificationService.initializeDefaultSettings(companyId, userId);
      res.json(result);
    } catch (error) {
      console.error('خطأ في API تهيئة إعدادات الإشعارات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Save notification settings
app.post('/api/notifications/settings',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const userId = req.session.user_id;
      
      const settingsData = {
        ...req.body,
        company_id: companyId,
        created_by: userId
      };
      
      const result = await notificationService.database.saveNotificationSettings(settingsData);
      
      res.json({
        success: true,
        message: 'تم حفظ إعدادات الإشعارات بنجاح',
        settingId: result
      });
    } catch (error) {
      console.error('خطأ في API حفظ إعدادات الإشعارات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Get message templates
app.get('/api/notifications/templates',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const { transaction_type, channel } = req.query;
      
      const templates = await notificationService.database.getMessageTemplates(
        companyId, 
        transaction_type, 
        channel
      );
      
      res.json({
        success: true,
        message: 'تم جلب قوالب الرسائل بنجاح',
        templates: templates
      });
    } catch (error) {
      console.error('خطأ في API جلب قوالب الرسائل:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Save message template
app.post('/api/notifications/templates',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const userId = req.session.user_id;
      
      const templateData = {
        ...req.body,
        company_id: companyId,
        created_by: userId,
        is_default: false,
        is_active: true
      };
      
      const result = await notificationService.database.saveMessageTemplate(templateData);
      
      res.json({
        success: true,
        message: 'تم حفظ القالب بنجاح',
        templateId: result
      });
    } catch (error) {
      console.error('خطأ في API حفظ قالب الرسالة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Get notification logs
app.get('/api/notifications/logs',
  companyMiddleware.requireAuth(),
  companyMiddleware.requireCompanyAccess(),
  async (req, res) => {
    try {
      const companyId = req.session.current_company_id;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      const logs = await notificationService.database.getNotificationLogsByCompany(
        companyId, 
        parseInt(limit), 
        offset
      );
      
      res.json({
        success: true,
        message: 'تم جلب سجلات الإشعارات بنجاح',
        logs: logs
      });
    } catch (error) {
      console.error('خطأ في API جلب سجلات الإشعارات:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم'
      });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('خطأ غير متوقع:', err.stack);
  res.status(500).json({
    success: false,
    message: 'خطأ داخلي في الخادم'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة المطلوبة غير موجودة'
  });
});

// Initialize the application
async function startServer() {
  try {
    // Initialize shared database first
    console.log('🔧 تهيئة قاعدة البيانات...');
    await sharedDatabase.init();
    
    // Share the database connection with all services
    userService.database = sharedDatabase;
    companyService.database = sharedDatabase;
    authService.database = sharedDatabase;
    transactionService.database = sharedDatabase;
    adminService.database = sharedDatabase;
    subscriberService.database = sharedDatabase;
    notificationService.database = sharedDatabase;
    companyMiddleware.database = sharedDatabase;

    // Initialize notification service separately for transaction service
    console.log('🔧 تهيئة الخدمات...');
    notificationService.database = sharedDatabase; // Share database with notification service
    transactionService.notificationService = notificationService; // Share notification service
    
    console.log('✅ تم تهيئة جميع الخدمات بنجاح');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📝 يمكنك الوصول للتطبيق على: http://localhost:${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/users`);
      console.log(`🏢 Company API: http://localhost:${PORT}/api/companies`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`💰 Transaction API: http://localhost:${PORT}/api/transactions`);
      console.log(`👥 Subscriber API: http://localhost:${PORT}/api/subscribers`);
      console.log(`⚙️ Admin API: http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error('فشل في بدء تشغيل الخادم:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 إغلاق الخادم...');
  sharedDatabase.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إغلاق الخادم...');
  sharedDatabase.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;