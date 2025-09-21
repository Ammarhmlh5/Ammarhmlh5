const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const UserService = require('./userService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize user service
const userService = new UserService();

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
    // Initialize database and user service
    await userService.init();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📝 يمكنك الوصول للتطبيق على: http://localhost:${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/users`);
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
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إغلاق الخادم...');
  userService.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;