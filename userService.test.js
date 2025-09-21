const request = require('supertest');
const UserService = require('./userService');
const fs = require('fs');
const path = require('path');

describe('User Management System Tests', () => {
  let userService;
  let app;

  beforeAll(async () => {
    userService = new UserService();
    await userService.init();
    
    // Import app after service initialization
    app = require('./server');
  });

  afterAll(async () => {
    userService.close();
  });

  beforeEach(async () => {
    // Clear users table before each test
    try {
      await new Promise((resolve, reject) => {
        userService.database.db.run('DELETE FROM users', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.warn('Could not clear users table:', error.message);
    }
  });

  describe('UserService Tests', () => {
    test('should create a valid user successfully', async () => {
      const userData = {
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '0501234567'
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم إنشاء المستخدم بنجاح');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.name).toBe('أحمد محمد');
      expect(result.user.email).toBe('ahmed@example.com');
    });

    test('should fail to create user with missing name', async () => {
      const userData = {
        email: 'test@example.com',
        phone: '0501234567'
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('الاسم مطلوب');
    });

    test('should fail to create user with invalid email', async () => {
      const userData = {
        name: 'محمد أحمد',
        email: 'invalid-email',
        phone: '0501234567'
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('البريد الإلكتروني غير صالح');
    });

    test('should fail to create user with duplicate email', async () => {
      const userData = {
        name: 'مستخدم أول',
        email: 'duplicate@example.com',
        phone: '0501234567'
      };

      // Create first user
      await userService.createUser(userData);

      // Try to create second user with same email
      const duplicateUserData = {
        name: 'مستخدم ثاني',
        email: 'duplicate@example.com',
        phone: '0509876543'
      };

      const result = await userService.createUser(duplicateUserData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('البريد الإلكتروني موجود بالفعل');
    });

    test('should retrieve all users successfully', async () => {
      // Create test users
      await userService.createUser({
        name: 'مستخدم 1',
        email: 'user1@example.com',
        phone: '0501111111'
      });

      await userService.createUser({
        name: 'مستخدم 2',
        email: 'user2@example.com',
        phone: '0502222222'
      });

      const result = await userService.getAllUsers();

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(2);
    });

    test('should retrieve user by ID successfully', async () => {
      const userData = {
        name: 'مستخدم للاختبار',
        email: 'testuser@example.com',
        phone: '0501234567'
      };

      const createResult = await userService.createUser(userData);
      const userId = createResult.user.id;

      const result = await userService.getUserById(userId);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.user.name).toBe('مستخدم للاختبار');
    });
  });

  describe('API Endpoint Tests', () => {
    test('POST /api/users should create user successfully', async () => {
      const userData = {
        name: 'فاطمة أحمد',
        email: 'fatima@example.com',
        phone: '0551234567'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إنشاء المستخدم بنجاح');
      expect(response.body.user).toBeDefined();
    });

    test('POST /api/users should fail with invalid data', async () => {
      const userData = {
        name: '',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/users should return all users', async () => {
      // Create a test user first
      await request(app)
        .post('/api/users')
        .send({
          name: 'عبدالله محمد',
          email: 'abdullah@example.com',
          phone: '0561234567'
        });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('GET /api/health should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('الخادم يعمل بشكل طبيعي');
    });
  });

  describe('Database Integration Tests', () => {
    test('should persist user data correctly', async () => {
      const userData = {
        name: 'سارة علي',
        email: 'sara@example.com',
        phone: '0571234567'
      };

      // Create user
      const createResult = await userService.createUser(userData);
      expect(createResult.success).toBe(true);

      // Verify user exists in database
      const getUserResult = await userService.getUserById(createResult.user.id);
      expect(getUserResult.success).toBe(true);
      expect(getUserResult.user.name).toBe('سارة علي');
      expect(getUserResult.user.email).toBe('sara@example.com');
    });

    test('should handle database constraints properly', async () => {
      const userData = {
        name: 'مريم محمد',
        email: 'mariam@example.com'
      };

      // Create first user
      const result1 = await userService.createUser(userData);
      expect(result1.success).toBe(true);

      // Try to create user with same email
      const result2 = await userService.createUser(userData);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('البريد الإلكتروني موجود بالفعل');
    });
  });
});