const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const UserService = require('./userService');
const CompanyService = require('./companyService');
const AuthService = require('./authService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const userService = new UserService();
const companyService = new CompanyService();
const authService = new AuthService();

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

app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Serve the main page
app.get('/', (req, res) => {
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
    // Initialize database and services
    await userService.init();
    await companyService.init();
    await authService.init();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📝 يمكنك الوصول للتطبيق على: http://localhost:${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/users`);
      console.log(`🏢 Company API: http://localhost:${PORT}/api/companies`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('فشل في بدء تشغيل الخادم:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 إغلاق الخادم...');
  userService.close();
  companyService.close();
  authService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إغلاق الخادم...');
  userService.close();
  companyService.close();
  authService.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;