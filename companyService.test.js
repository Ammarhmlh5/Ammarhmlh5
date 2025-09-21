const request = require('supertest');
const CompanyService = require('./companyService');

describe('Company Management System Tests', () => {
  let companyService;
  let app;

  beforeAll(async () => {
    companyService = new CompanyService();
    await companyService.init();
    
    // Import app after service initialization
    app = require('./server');
  });

  afterAll(async () => {
    companyService.close();
  });

  beforeEach(async () => {
    // Clear tables before each test
    try {
      await new Promise((resolve, reject) => {
        companyService.database.db.run('DELETE FROM users', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await new Promise((resolve, reject) => {
        companyService.database.db.run('DELETE FROM companies', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.warn('Could not clear tables:', error.message);
    }
  });

  describe('CompanyService Tests', () => {
    test('should register company with admin user successfully', async () => {
      const companyData = {
        name: 'شركة التقنية المتطورة',
        email: 'info@techcompany.com',
        phone: '0501234567',
        address: 'الرياض، المملكة العربية السعودية',
        description: 'شركة تقنية متطورة',
        adminName: 'أحمد محمد',
        adminEmail: 'admin@techcompany.com',
        adminPhone: '0509876543'
      };

      const result = await companyService.registerCompany(companyData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم تسجيل الشركة وتفعيل حساب المدير بنجاح');
      expect(result.company).toBeDefined();
      expect(result.admin).toBeDefined();
      expect(result.company.name).toBe('شركة التقنية المتطورة');
      expect(result.admin.name).toBe('أحمد محمد');
      expect(result.admin.role).toBe('admin');
      expect(result.admin.is_active).toBe(1);
    });

    test('should fail to register company with missing data', async () => {
      const companyData = {
        name: '',
        email: 'invalid-email',
        adminName: 'أحمد',
        adminEmail: 'admin@company.com'
      };

      const result = await companyService.registerCompany(companyData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('خطأ في التحقق من البيانات');
    });

    test('should fail to register company with duplicate email', async () => {
      const companyData = {
        name: 'شركة الأولى',
        email: 'duplicate@company.com',
        phone: '0501234567',
        adminName: 'مدير أول',
        adminEmail: 'admin1@company.com',
        adminPhone: '0509876543'
      };

      // Register first company
      await companyService.registerCompany(companyData);

      // Try to register second company with same email
      const duplicateCompanyData = {
        name: 'شركة الثانية',
        email: 'duplicate@company.com',
        phone: '0501234567',
        adminName: 'مدير ثاني',
        adminEmail: 'admin2@company.com',
        adminPhone: '0509876543'
      };

      const result = await companyService.registerCompany(duplicateCompanyData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('البريد الإلكتروني للشركة موجود بالفعل');
    });

    test('should retrieve all companies successfully', async () => {
      // Register test companies
      await companyService.registerCompany({
        name: 'شركة 1',
        email: 'company1@example.com',
        phone: '0501111111',
        adminName: 'مدير 1',
        adminEmail: 'admin1@example.com',
        adminPhone: '0502222222'
      });

      await companyService.registerCompany({
        name: 'شركة 2',
        email: 'company2@example.com',
        phone: '0503333333',
        adminName: 'مدير 2',
        adminEmail: 'admin2@example.com',
        adminPhone: '0504444444'
      });

      const result = await companyService.getAllCompanies();

      expect(result.success).toBe(true);
      expect(result.companies).toHaveLength(2);
    });

    test('should retrieve company by ID successfully', async () => {
      const companyData = {
        name: 'شركة للاختبار',
        email: 'test@company.com',
        phone: '0501234567',
        adminName: 'مدير للاختبار',
        adminEmail: 'admin@test.com',
        adminPhone: '0509876543'
      };

      const registerResult = await companyService.registerCompany(companyData);
      const companyId = registerResult.company.id;

      const result = await companyService.getCompanyById(companyId);

      expect(result.success).toBe(true);
      expect(result.company).toBeDefined();
      expect(result.company.id).toBe(companyId);
      expect(result.company.name).toBe('شركة للاختبار');
    });

    test('should retrieve users by company successfully', async () => {
      const companyData = {
        name: 'شركة مع مستخدمين',
        email: 'users@company.com',
        phone: '0501234567',
        adminName: 'المدير الرئيسي',
        adminEmail: 'ceo@company.com',
        adminPhone: '0509876543'
      };

      const registerResult = await companyService.registerCompany(companyData);
      const companyId = registerResult.company.id;

      const result = await companyService.getUsersByCompany(companyId);

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(1); // Should have the admin user
      expect(result.users[0].role).toBe('admin');
      expect(result.users[0].company_name).toBe('شركة مع مستخدمين');
    });
  });

  describe('Company API Endpoint Tests', () => {
    test('POST /api/companies/register should register company successfully', async () => {
      const companyData = {
        name: 'شركة عبر API',
        email: 'api@company.com',
        phone: '0551234567',
        address: 'جدة، المملكة العربية السعودية',
        description: 'شركة مسجلة عبر API',
        adminName: 'مدير API',
        adminEmail: 'admin@api.com',
        adminPhone: '0559876543'
      };

      const response = await request(app)
        .post('/api/companies/register')
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تسجيل الشركة وتفعيل حساب المدير بنجاح');
      expect(response.body.company).toBeDefined();
      expect(response.body.admin).toBeDefined();
    });

    test('POST /api/companies/register should fail with invalid data', async () => {
      const companyData = {
        name: '',
        email: 'invalid-email',
        adminName: '',
        adminEmail: 'invalid'
      };

      const response = await request(app)
        .post('/api/companies/register')
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/companies should return all companies', async () => {
      // Register a test company first
      await request(app)
        .post('/api/companies/register')
        .send({
          name: 'شركة للعرض',
          email: 'display@company.com',
          phone: '0561234567',
          adminName: 'مدير العرض',
          adminEmail: 'admin@display.com',
          adminPhone: '0569876543'
        });

      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.companies).toBeDefined();
      expect(response.body.companies.length).toBeGreaterThan(0);
    });

    test('GET /api/companies/:id/users should return company users', async () => {
      // Register a test company first
      const registerResponse = await request(app)
        .post('/api/companies/register')
        .send({
          name: 'شركة مع موظفين',
          email: 'employees@company.com',
          phone: '0571234567',
          adminName: 'مدير الموظفين',
          adminEmail: 'hr@company.com',
          adminPhone: '0579876543'
        });

      const companyId = registerResponse.body.company.id;

      const response = await request(app)
        .get(`/api/companies/${companyId}/users`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].role).toBe('admin');
    });
  });
});