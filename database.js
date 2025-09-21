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
      // Create companies table
      const createCompaniesTable = `
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          address TEXT,
          description TEXT,
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
          phone TEXT,
          company_id INTEGER,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
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
              resolve();
            }
          });
        }
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