// Database Configuration for Multi-Database Support
// دعم قواعد البيانات المتعددة - SQLite و PostgreSQL

const Database = require('./database'); // SQLite database
const PostgresDatabase = require('./postgresDatabase'); // PostgreSQL database

class DatabaseConfig {
  constructor() {
    this.database = null;
    this.dbType = process.env.DB_TYPE || 'sqlite'; // Default to SQLite for backward compatibility
  }

  // Initialize the appropriate database based on configuration
  async init() {
    console.log(`🔄 بدء تهيئة قاعدة البيانات - نوع: ${this.dbType}`);
    
    if (this.dbType.toLowerCase() === 'postgresql' || this.dbType.toLowerCase() === 'postgres') {
      this.database = new PostgresDatabase();
      
      const config = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'user_management_system',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT) || 5432,
      };
      
      await this.database.init(config);
    } else {
      // Default to SQLite
      this.database = new Database();
      await this.database.init();
    }
    
    console.log(`✅ تم تهيئة قاعدة البيانات بنجاح - نوع: ${this.dbType}`);
    return this.database;
  }

  // Get the current database instance
  getDatabase() {
    if (!this.database) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.database;
  }

  // Get database type
  getDatabaseType() {
    return this.dbType;
  }

  // Health check for the current database
  async healthCheck() {
    if (!this.database) {
      return {
        status: 'unhealthy',
        error: 'Database not initialized',
        type: this.dbType
      };
    }

    if (typeof this.database.healthCheck === 'function') {
      return await this.database.healthCheck();
    } else {
      // For SQLite (legacy database class)
      try {
        // Simple test query
        if (this.dbType === 'sqlite') {
          return new Promise((resolve) => {
            this.database.db.get("SELECT datetime('now') as current_time", (err, row) => {
              if (err) {
                resolve({
                  status: 'unhealthy',
                  error: err.message,
                  database: 'SQLite'
                });
              } else {
                resolve({
                  status: 'healthy',
                  timestamp: row.current_time,
                  database: 'SQLite'
                });
              }
            });
          });
        }
      } catch (err) {
        return {
          status: 'unhealthy',
          error: err.message,
          database: this.dbType
        };
      }
    }
  }

  // Close database connection
  async close() {
    if (this.database && typeof this.database.close === 'function') {
      await this.database.close();
    }
  }
}

// Create a singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;