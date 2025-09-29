const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class PostgresDatabase {
  constructor() {
    this.pool = null;
  }

  // Initialize the PostgreSQL database connection
  async init(config = {}) {
    const defaultConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'user_management_system',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // how long to wait for a connection
    };

    this.pool = new Pool({ ...defaultConfig, ...config });

    try {
      // Test the connection
      const client = await this.pool.connect();
      console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح');
      client.release();
      
      // Create tables if they don't exist
      await this.createTables();
      
      return true;
    } catch (err) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
      throw err;
    }
  }

  // Create all tables from SQL file
  async createTables() {
    try {
      const sqlPath = path.join(__dirname, 'postgresql-setup.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

      console.log('🔄 بدء إنشاء الجداول في PostgreSQL...');
      
      for (const statement of statements) {
        try {
          if (statement.toLowerCase().includes('create table') || 
              statement.toLowerCase().includes('create index') ||
              statement.toLowerCase().includes('create trigger') ||
              statement.toLowerCase().includes('create extension') ||
              statement.toLowerCase().includes('create or replace function') ||
              statement.toLowerCase().includes('insert into')) {
            await this.pool.query(statement);
          }
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
            console.warn('⚠️ تحذير في تنفيذ العبارة:', err.message);
          }
        }
      }
      
      console.log('✅ تم إنشاء جميع الجداول بنجاح');
    } catch (err) {
      console.error('❌ خطأ في إنشاء الجداول:', err.message);
      throw err;
    }
  }

  // Execute a query
  async query(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (err) {
      console.error('❌ خطأ في تنفيذ الاستعلام:', err.message);
      throw err;
    }
  }

  // Get a single row
  async get(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return result.rows[0] || null;
    } catch (err) {
      console.error('❌ خطأ في جلب السجل:', err.message);
      throw err;
    }
  }

  // Get all rows
  async all(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (err) {
      console.error('❌ خطأ في جلب السجلات:', err.message);
      throw err;
    }
  }

  // Run a query (for INSERT, UPDATE, DELETE)
  async run(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return {
        changes: result.rowCount,
        lastID: result.rows[0]?.id || null
      };
    } catch (err) {
      console.error('❌ خطأ في تنفيذ العملية:', err.message);
      throw err;
    }
  }

  // Company Management Methods
  async createCompany(companyData) {
    const { name, email, phone, address, description, subscription_plan = 'basic' } = companyData;
    
    const query = `
      INSERT INTO companies (name, email, phone, address, description, subscription_plan)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.query(query, [name, email, phone, address, description, subscription_plan]);
    return result.rows[0];
  }

  async getCompanyByEmail(email) {
    const query = 'SELECT * FROM companies WHERE email = $1';
    return await this.get(query, [email]);
  }

  async getCompanyById(id) {
    const query = 'SELECT * FROM companies WHERE id = $1';
    return await this.get(query, [id]);
  }

  async getAllCompanies() {
    const query = 'SELECT * FROM companies ORDER BY created_at DESC';
    return await this.all(query);
  }

  async updateCompany(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE companies 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  // User Management Methods
  async createUser(userData) {
    const { name, email, password, phone, company_id, role = 'user' } = userData;
    
    const query = `
      INSERT INTO users (name, email, password, phone, company_id, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.query(query, [name, email, password, phone, company_id, role]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    return await this.get(query, [email]);
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    return await this.get(query, [id]);
  }

  async getUsersByCompany(companyId) {
    const query = 'SELECT * FROM users WHERE company_id = $1 ORDER BY created_at DESC';
    return await this.all(query, [companyId]);
  }

  // Transaction Management Methods
  async createTransaction(transactionData) {
    const { 
      company_id, 
      electronic_number, 
      transaction_type, 
      amount, 
      description, 
      reference_number, 
      transaction_date, 
      created_by 
    } = transactionData;
    
    const query = `
      INSERT INTO transactions (
        company_id, electronic_number, transaction_type, amount, 
        description, reference_number, transaction_date, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      company_id, electronic_number, transaction_type, amount,
      description, reference_number, transaction_date, created_by
    ]);
    
    return result.rows[0];
  }

  async getTransactionsByCompany(companyId, limit = 50) {
    const query = `
      SELECT * FROM transactions 
      WHERE company_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    return await this.all(query, [companyId, limit]);
  }

  // Transaction Counter Methods
  async getNextTransactionNumber(companyId, transactionType, year = new Date().getFullYear()) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get or create counter
      let counter = await client.query(
        'SELECT * FROM transaction_counters WHERE company_id = $1 AND year = $2 AND transaction_type = $3',
        [companyId, year, transactionType]
      );
      
      if (counter.rows.length === 0) {
        // Create new counter
        await client.query(
          'INSERT INTO transaction_counters (company_id, year, transaction_type, current_number) VALUES ($1, $2, $3, 1)',
          [companyId, year, transactionType]
        );
        
        await client.query('COMMIT');
        return 1;
      } else {
        // Increment counter
        const newNumber = counter.rows[0].current_number + 1;
        
        await client.query(
          'UPDATE transaction_counters SET current_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newNumber, counter.rows[0].id]
        );
        
        await client.query('COMMIT');
        return newNumber;
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Subscriber Management Methods
  async createSubscriber(subscriberData) {
    const {
      company_id, account_number, full_name, address, phone,
      business_type, meter_system_type, tariff_type, tariff_group,
      id_card_number, photo_path, property_ownership, connection_amount,
      created_by
    } = subscriberData;
    
    const query = `
      INSERT INTO subscribers (
        company_id, account_number, full_name, address, phone,
        business_type, meter_system_type, tariff_type, tariff_group,
        id_card_number, photo_path, property_ownership, connection_amount,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      company_id, account_number, full_name, address, phone,
      business_type, meter_system_type, tariff_type, tariff_group,
      id_card_number, photo_path, property_ownership, connection_amount,
      created_by
    ]);
    
    return result.rows[0];
  }

  async getSubscribersByCompany(companyId, limit = 50) {
    const query = `
      SELECT * FROM subscribers 
      WHERE company_id = $1 AND is_active = true
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    return await this.all(query, [companyId, limit]);
  }

  // Admin Log Methods
  async createAdminLog(logData) {
    const { company_id, admin_user_id, action_type, description, affected_user_id, metadata } = logData;
    
    const query = `
      INSERT INTO admin_logs (company_id, admin_user_id, action_type, description, affected_user_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      company_id, admin_user_id, action_type, description, affected_user_id,
      metadata ? JSON.stringify(metadata) : null
    ]);
    
    return result.rows[0];
  }

  // Close the database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ تم إغلاق اتصال قاعدة البيانات');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        database: 'PostgreSQL'
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        error: err.message,
        database: 'PostgreSQL'
      };
    }
  }
}

module.exports = PostgresDatabase;