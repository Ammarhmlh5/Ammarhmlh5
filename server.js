const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const UserService = require('./userService');
const CompanyService = require('./companyService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const userService = new UserService();
const companyService = new CompanyService();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📝 يمكنك الوصول للتطبيق على: http://localhost:${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/users`);
      console.log(`🏢 Company API: http://localhost:${PORT}/api/companies`);
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
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إغلاق الخادم...');
  userService.close();
  companyService.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;