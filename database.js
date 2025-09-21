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

  // Create the users table if it doesn't exist
  async createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('خطأ في إنشاء جدول المستخدمين:', err.message);
          reject(err);
        } else {
          console.log('تم إنشاء جدول المستخدمين بنجاح');
          resolve();
        }
      });
    });
  }

  // Save a new user to the database
  async saveUser(userData) {
    return new Promise((resolve, reject) => {
      const { name, email, phone } = userData;
      
      // Validate required fields
      if (!name || !email) {
        return reject(new Error('الاسم والبريد الإلكتروني مطلوبان'));
      }

      const insertQuery = `
        INSERT INTO users (name, email, phone)
        VALUES (?, ?, ?)
      `;

      this.db.run(insertQuery, [name, email, phone], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
      const query = 'SELECT * FROM users WHERE id = ?';
      
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