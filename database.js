const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize the database connection
  async init() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, 'users.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
          reject(err);
        } else {
          console.log('تم الاتصال بقاعدة البيانات بنجاح');
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  // Create all tables if they don't exist
  async createTables() {
    return new Promise((resolve, reject) => {
      // Create companies table with subscription info
      const createCompaniesTable = `
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          address TEXT,
          description TEXT,
          subscription_status TEXT DEFAULT 'active',
          subscription_plan TEXT DEFAULT 'basic',
          max_users INTEGER DEFAULT 10,
          max_storage_mb INTEGER DEFAULT 1000,
          subscription_expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create users table with company relationship and role
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          phone TEXT,
          company_id INTEGER,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT 1,
          can_access_multiple_companies BOOLEAN DEFAULT 0,
          reset_token TEXT,
          reset_token_expires DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `;

      // Create user_company_access table for multi-company access
      const createUserCompanyAccessTable = `
        CREATE TABLE IF NOT EXISTS user_company_access (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (company_id) REFERENCES companies (id),
          UNIQUE(user_id, company_id)
        )
      `;

      // Create transaction_counters table for unique electronic numbers
      const createTransactionCountersTable = `
        CREATE TABLE IF NOT EXISTS transaction_counters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          year INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          current_number INTEGER DEFAULT 0,
          prefix TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          UNIQUE(company_id, year, transaction_type)
        )
      `;

      // Create transactions table for financial records
      const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          electronic_number TEXT NOT NULL,
          transaction_type TEXT NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          description TEXT,
          reference_number TEXT,
          transaction_date DATE NOT NULL,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          UNIQUE(company_id, electronic_number)
        )
      `;

      // Create accounts table with company isolation
      const createAccountsTable = `
        CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          account_code TEXT NOT NULL,
          account_name TEXT NOT NULL,
          account_type TEXT NOT NULL,
          parent_account_id INTEGER,
          balance DECIMAL(15,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (parent_account_id) REFERENCES accounts (id),
          UNIQUE(company_id, account_code)
        )
      `;

      // Create admin_logs table for monitoring
      const createAdminLogsTable = `
        CREATE TABLE IF NOT EXISTS admin_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER,
          admin_user_id INTEGER,
          action_type TEXT NOT NULL,
          description TEXT NOT NULL,
          affected_user_id INTEGER,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (admin_user_id) REFERENCES users (id),
          FOREIGN KEY (affected_user_id) REFERENCES users (id)
        )
      `;

      // First create companies table
      this.db.run(createCompaniesTable, (err) => {
        if (err) {
          console.error('خطأ في إنشاء جدول الشركات:', err.message);
          reject(err);
        } else {
          console.log('تم إنشاء جدول الشركات بنجاح');
          
          // Then create users table
          this.db.run(createUsersTable, (err) => {
            if (err) {
              console.error('خطأ في إنشاء جدول المستخدمين:', err.message);
              reject(err);
            } else {
              console.log('تم إنشاء جدول المستخدمين بنجاح');
              
              // Create user company access table
              this.db.run(createUserCompanyAccessTable, (err) => {
                if (err) {
                  console.error('خطأ في إنشاء جدول صلاحيات الشركات:', err.message);
                  reject(err);
                } else {
                  console.log('تم إنشاء جدول صلاحيات الشركات بنجاح');
                  
                  // Create transaction counters table
                  this.db.run(createTransactionCountersTable, (err) => {
                    if (err) {
                      console.error('خطأ في إنشاء جدول عدادات المعاملات:', err.message);
                      reject(err);
                    } else {
                      console.log('تم إنشاء جدول عدادات المعاملات بنجاح');
                      
                      // Create transactions table
                      this.db.run(createTransactionsTable, (err) => {
                        if (err) {
                          console.error('خطأ في إنشاء جدول المعاملات المالية:', err.message);
                          reject(err);
                        } else {
                          console.log('تم إنشاء جدول المعاملات المالية بنجاح');
                          
                          // Create accounts table
                          this.db.run(createAccountsTable, (err) => {
                            if (err) {
                              console.error('خطأ في إنشاء جدول الحسابات:', err.message);
                              reject(err);
                            } else {
                              console.log('تم إنشاء جدول الحسابات بنجاح');
                              
                              // Create admin logs table
                              this.db.run(createAdminLogsTable, (err) => {
                                if (err) {
                                  console.error('خطأ في إنشاء جدول سجلات المدير:', err.message);
                                  reject(err);
                                } else {
                                  console.log('تم إنشاء جدول سجلات المدير بنجاح');
                                  
                                  // Run migrations to add missing columns
                                  this.runMigrations()
                                    .then(() => resolve())
                                    .catch(reject);
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  }

  // Run database migrations
  async runMigrations() {
    return new Promise((resolve, reject) => {
      // Check what columns exist in tables and add missing ones
      this.db.all("PRAGMA table_info(users)", (err, userColumns) => {
        if (err) {
          console.error('خطأ في فحص هيكل جدول المستخدمين:', err.message);
          reject(err);
          return;
        }

        this.db.all("PRAGMA table_info(companies)", (err, companyColumns) => {
          if (err) {
            console.error('خطأ في فحص هيكل جدول الشركات:', err.message);
            reject(err);
            return;
          }

          let migrations = [];
          
          // Check user table columns
          const hasPassword = userColumns.some(col => col.name === 'password');
          const hasResetToken = userColumns.some(col => col.name === 'reset_token');
          const hasResetTokenExpires = userColumns.some(col => col.name === 'reset_token_expires');
          const hasCanAccessMultiple = userColumns.some(col => col.name === 'can_access_multiple_companies');
          
          // Check company table columns
          const hasSubscriptionStatus = companyColumns.some(col => col.name === 'subscription_status');
          const hasSubscriptionPlan = companyColumns.some(col => col.name === 'subscription_plan');
          const hasMaxUsers = companyColumns.some(col => col.name === 'max_users');
          const hasMaxStorage = companyColumns.some(col => col.name === 'max_storage_mb');
          const hasSubscriptionExpires = companyColumns.some(col => col.name === 'subscription_expires_at');
          
          // Add missing user columns
          if (!hasPassword) {
            migrations.push("ALTER TABLE users ADD COLUMN password TEXT");
          }
          if (!hasResetToken) {
            migrations.push("ALTER TABLE users ADD COLUMN reset_token TEXT");
          }
          if (!hasResetTokenExpires) {
            migrations.push("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME");
          }
          if (!hasCanAccessMultiple) {
            migrations.push("ALTER TABLE users ADD COLUMN can_access_multiple_companies BOOLEAN DEFAULT 0");
          }
          
          // Add missing company columns
          if (!hasSubscriptionStatus) {
            migrations.push("ALTER TABLE companies ADD COLUMN subscription_status TEXT DEFAULT 'active'");
          }
          if (!hasSubscriptionPlan) {
            migrations.push("ALTER TABLE companies ADD COLUMN subscription_plan TEXT DEFAULT 'basic'");
          }
          if (!hasMaxUsers) {
            migrations.push("ALTER TABLE companies ADD COLUMN max_users INTEGER DEFAULT 10");
          }
          if (!hasMaxStorage) {
            migrations.push("ALTER TABLE companies ADD COLUMN max_storage_mb INTEGER DEFAULT 1000");
          }
          if (!hasSubscriptionExpires) {
            migrations.push("ALTER TABLE companies ADD COLUMN subscription_expires_at DATETIME");
          }

          if (migrations.length === 0) {
            console.log('جميع العمليات الترحيلية مكتملة');
            resolve();
            return;
          }

          console.log(`تشغيل ${migrations.length} عملية ترحيل للقاعدة...`);
          
          let completed = 0;
          migrations.forEach((migration, index) => {
            this.db.run(migration, (err) => {
              if (err) {
                console.error(`خطأ في الترحيل ${index + 1}:`, err.message);
                reject(err);
              } else {
                console.log(`تمت العملية الترحيلية ${index + 1}: ${migration}`);
                completed++;
                if (completed === migrations.length) {
                  console.log('تمت جميع العمليات الترحيلية بنجاح');
                  resolve();
                }
              }
            });
          });
        });
      });
    });
  }

  // Save a new user to the database
  async saveUser(userData) {
    return new Promise((resolve, reject) => {
      const { name, email, phone, company_id, role, is_active } = userData;
      
      // Validate required fields
      if (!name || !email) {
        return reject(new Error('الاسم والبريد الإلكتروني مطلوبان'));
      }

      const insertQuery = `
        INSERT INTO users (name, email, phone, company_id, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const userRole = role || 'user';
      const activeStatus = is_active !== undefined ? is_active : 1;

      this.db.run(insertQuery, [name, email, phone, company_id || null, userRole, activeStatus], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('البريد الإلكتروني موجود بالفعل'));
          } else {
            console.error('خطأ في حفظ المستخدم:', err.message);
            reject(new Error('فشل في حفظ المستخدم في قاعدة البيانات'));
          }
        } else {
          console.log(`تم حفظ المستخدم بنجاح بالمعرف: ${this.lastID}`);
          resolve({
            id: this.lastID,
            name,
            email,
            phone,
            company_id: company_id || null,
            role: userRole,
            is_active: activeStatus,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  // Get all users
  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users ORDER BY created_at DESC';
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب المستخدمين:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get user by ID
  async getUserById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, c.name as company_name 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE u.id = ?
      `;
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          console.error('خطأ في جلب المستخدم:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Save a new company to the database
  async saveCompany(companyData) {
    return new Promise((resolve, reject) => {
      const { name, email, phone, address, description } = companyData;
      
      // Validate required fields
      if (!name || !email) {
        return reject(new Error('اسم الشركة والبريد الإلكتروني مطلوبان'));
      }

      const insertQuery = `
        INSERT INTO companies (name, email, phone, address, description)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(insertQuery, [name, email, phone || null, address || null, description || null], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('البريد الإلكتروني للشركة موجود بالفعل'));
          } else {
            console.error('خطأ في حفظ الشركة:', err.message);
            reject(new Error('فشل في حفظ الشركة في قاعدة البيانات'));
          }
        } else {
          console.log(`تم حفظ الشركة بنجاح بالمعرف: ${this.lastID}`);
          resolve({
            id: this.lastID,
            name,
            email,
            phone: phone || null,
            address: address || null,
            description: description || null,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  // Get all companies
  async getAllCompanies() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM companies ORDER BY created_at DESC';
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب الشركات:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get company by ID
  async getCompanyById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM companies WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          console.error('خطأ في جلب الشركة:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get users by company
  async getUsersByCompany(companyId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, c.name as company_name 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE u.company_id = ? 
        ORDER BY u.created_at DESC
      `;
      
      this.db.all(query, [companyId], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب مستخدمي الشركة:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get user by email for authentication
  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT users.*, companies.name as company_name 
        FROM users 
        LEFT JOIN companies ON users.company_id = companies.id 
        WHERE users.email = ?
      `;
      
      this.db.get(query, [email], (err, row) => {
        if (err) {
          console.error('خطأ في جلب المستخدم بالبريد الإلكتروني:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Update user password
  async updateUserPassword(userId, hashedPassword) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      this.db.run(query, [hashedPassword, userId], function(err) {
        if (err) {
          console.error('خطأ في تحديث كلمة المرور:', err.message);
          reject(err);
        } else {
          console.log('تم تحديث كلمة المرور بنجاح للمستخدم:', userId);
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Set password reset token
  async setResetToken(email, token, expires) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?`;
      
      this.db.run(query, [token, expires, email], function(err) {
        if (err) {
          console.error('خطأ في تعيين رمز الاسترداد:', err.message);
          reject(err);
        } else {
          console.log('تم تعيين رمز الاسترداد بنجاح للبريد:', email);
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Get user by reset token
  async getUserByResetToken(token) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users 
        WHERE reset_token = ? AND reset_token_expires > datetime('now')
      `;
      
      this.db.get(query, [token], (err, row) => {
        if (err) {
          console.error('خطأ في جلب المستخدم برمز الاسترداد:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Clear reset token
  async clearResetToken(userId) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      this.db.run(query, [userId], function(err) {
        if (err) {
          console.error('خطأ في مسح رمز الاسترداد:', err.message);
          reject(err);
        } else {
          console.log('تم مسح رمز الاسترداد بنجاح للمستخدم:', userId);
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Multi-tenant methods

  // Update company subscription
  async updateCompanySubscription(companyId, subscriptionData) {
    return new Promise((resolve, reject) => {
      const { subscription_status, subscription_plan, max_users, max_storage_mb, subscription_expires_at } = subscriptionData;
      const query = `
        UPDATE companies 
        SET subscription_status = ?, subscription_plan = ?, max_users = ?, max_storage_mb = ?, 
            subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(query, [subscription_status, subscription_plan, max_users, max_storage_mb, subscription_expires_at, companyId], function(err) {
        if (err) {
          console.error('خطأ في تحديث اشتراك الشركة:', err.message);
          reject(err);
        } else {
          console.log('تم تحديث اشتراك الشركة بنجاح:', companyId);
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Add user to company access
  async addUserCompanyAccess(userId, companyId, role = 'user') {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO user_company_access (user_id, company_id, role, is_active, created_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      `;
      
      this.db.run(query, [userId, companyId, role], function(err) {
        if (err) {
          console.error('خطأ في إضافة صلاحية الشركة للمستخدم:', err.message);
          reject(err);
        } else {
          console.log('تم إضافة صلاحية الشركة للمستخدم بنجاح:', this.lastID);
          resolve({
            id: this.lastID,
            user_id: userId,
            company_id: companyId,
            role: role
          });
        }
      });
    });
  }

  // Get user's accessible companies
  async getUserAccessibleCompanies(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.*, uca.role as access_role, uca.is_active as access_active
        FROM companies c
        INNER JOIN user_company_access uca ON c.id = uca.company_id
        WHERE uca.user_id = ? AND uca.is_active = 1 AND c.subscription_status = 'active'
        ORDER BY c.name
      `;
      
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب شركات المستخدم:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get next electronic transaction number
  async getNextTransactionNumber(companyId, transactionType, year = null) {
    return new Promise((resolve, reject) => {
      if (!year) {
        year = new Date().getFullYear();
      }
      
      // First, try to get existing counter
      const selectQuery = `
        SELECT current_number, prefix FROM transaction_counters 
        WHERE company_id = ? AND year = ? AND transaction_type = ?
      `;
      
      this.db.get(selectQuery, [companyId, year, transactionType], (err, row) => {
        if (err) {
          console.error('خطأ في جلب عداد المعاملات:', err.message);
          reject(err);
        } else if (row) {
          // Update existing counter
          const newNumber = row.current_number + 1;
          const updateQuery = `
            UPDATE transaction_counters 
            SET current_number = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE company_id = ? AND year = ? AND transaction_type = ?
          `;
          
          this.db.run(updateQuery, [newNumber, companyId, year, transactionType], (err) => {
            if (err) {
              console.error('خطأ في تحديث عداد المعاملات:', err.message);
              reject(err);
            } else {
              const electronicNumber = `${row.prefix}${year}-${newNumber.toString().padStart(6, '0')}`;
              resolve(electronicNumber);
            }
          });
        } else {
          // Create new counter
          const prefix = transactionType.substring(0, 3).toUpperCase();
          const insertQuery = `
            INSERT INTO transaction_counters (company_id, year, transaction_type, current_number, prefix)
            VALUES (?, ?, ?, 1, ?)
          `;
          
          this.db.run(insertQuery, [companyId, year, transactionType, prefix], (err) => {
            if (err) {
              console.error('خطأ في إنشاء عداد المعاملات:', err.message);
              reject(err);
            } else {
              const electronicNumber = `${prefix}${year}-000001`;
              resolve(electronicNumber);
            }
          });
        }
      });
    });
  }

  // Save transaction with electronic number
  async saveTransaction(transactionData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { company_id, transaction_type, amount, description, reference_number, transaction_date, created_by } = transactionData;
        
        // Get next electronic number
        const electronicNumber = await this.getNextTransactionNumber(company_id, transaction_type);
        
        const query = `
          INSERT INTO transactions (company_id, electronic_number, transaction_type, amount, description, reference_number, transaction_date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        this.db.run(query, [company_id, electronicNumber, transaction_type, amount, description, reference_number, transaction_date, created_by], function(err) {
          if (err) {
            console.error('خطأ في حفظ المعاملة:', err.message);
            reject(err);
          } else {
            console.log('تم حفظ المعاملة بنجاح بالرقم الإلكتروني:', electronicNumber);
            resolve({
              id: this.lastID,
              electronic_number: electronicNumber,
              ...transactionData
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get transactions by company
  async getTransactionsByCompany(companyId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT t.*, u.name as created_by_name
        FROM transactions t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.company_id = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      this.db.all(query, [companyId, limit, offset], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب معاملات الشركة:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Save account with company isolation
  async saveAccount(accountData) {
    return new Promise((resolve, reject) => {
      const { company_id, account_code, account_name, account_type, parent_account_id, balance } = accountData;
      const query = `
        INSERT INTO accounts (company_id, account_code, account_name, account_type, parent_account_id, balance)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [company_id, account_code, account_name, account_type, parent_account_id, balance || 0], function(err) {
        if (err) {
          console.error('خطأ في حفظ الحساب:', err.message);
          reject(err);
        } else {
          console.log('تم حفظ الحساب بنجاح:', this.lastID);
          resolve({
            id: this.lastID,
            ...accountData
          });
        }
      });
    });
  }

  // Get accounts by company
  async getAccountsByCompany(companyId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, pa.account_name as parent_account_name
        FROM accounts a
        LEFT JOIN accounts pa ON a.parent_account_id = pa.id
        WHERE a.company_id = ? AND a.is_active = 1
        ORDER BY a.account_code
      `;
      
      this.db.all(query, [companyId], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب حسابات الشركة:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Log admin action
  async logAdminAction(logData) {
    return new Promise((resolve, reject) => {
      const { company_id, admin_user_id, action_type, description, affected_user_id, metadata } = logData;
      const query = `
        INSERT INTO admin_logs (company_id, admin_user_id, action_type, description, affected_user_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [company_id, admin_user_id, action_type, description, affected_user_id, metadata ? JSON.stringify(metadata) : null], function(err) {
        if (err) {
          console.error('خطأ في تسجيل إجراء المدير:', err.message);
          reject(err);
        } else {
          console.log('تم تسجيل إجراء المدير بنجاح:', this.lastID);
          resolve(this.lastID);
        }
      });
    });
  }

  // Get admin logs by company
  async getAdminLogsByCompany(companyId, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT al.*, au.name as admin_name, u.name as affected_user_name
        FROM admin_logs al
        LEFT JOIN users au ON al.admin_user_id = au.id
        LEFT JOIN users u ON al.affected_user_id = u.id
        WHERE al.company_id = ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      this.db.all(query, [companyId, limit, offset], (err, rows) => {
        if (err) {
          console.error('خطأ في جلب سجلات المدير:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get company usage statistics
  async getCompanyUsageStats(companyId) {
    return new Promise((resolve, reject) => {
      const queries = {
        userCount: `SELECT COUNT(*) as count FROM users WHERE company_id = ? AND is_active = 1`,
        transactionCount: `SELECT COUNT(*) as count FROM transactions WHERE company_id = ?`,
        accountCount: `SELECT COUNT(*) as count FROM accounts WHERE company_id = ? AND is_active = 1`
      };
      
      let completed = 0;
      let stats = {};
      
      Object.keys(queries).forEach(key => {
        this.db.get(queries[key], [companyId], (err, row) => {
          if (err) {
            console.error(`خطأ في جلب إحصائية ${key}:`, err.message);
            reject(err);
          } else {
            stats[key] = row.count;
            completed++;
            if (completed === Object.keys(queries).length) {
              resolve(stats);
            }
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('خطأ في إغلاق قاعدة البيانات:', err.message);
        } else {
          console.log('تم إغلاق اتصال قاعدة البيانات');
        }
      });
    }
  }
}

module.exports = Database;