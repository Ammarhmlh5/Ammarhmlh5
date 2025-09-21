const Database = require('./database');

class TransactionService {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Validate transaction data
  validateTransactionData(transactionData) {
    const { company_id, transaction_type, amount, description, transaction_date } = transactionData;
    const errors = [];

    // Validate company_id
    if (!company_id || isNaN(company_id)) {
      errors.push('معرف الشركة مطلوب ويجب أن يكون رقم صالح');
    }

    // Validate transaction_type
    if (!transaction_type || typeof transaction_type !== 'string' || transaction_type.trim().length === 0) {
      errors.push('نوع المعاملة مطلوب ويجب أن يكون نص صالح');
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      errors.push('المبلغ مطلوب ويجب أن يكون رقم موجب');
    }

    // Validate description
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('وصف المعاملة مطلوب');
    }

    // Validate transaction_date
    if (!transaction_date || isNaN(Date.parse(transaction_date))) {
      errors.push('تاريخ المعاملة مطلوب ويجب أن يكون تاريخ صالح');
    }

    return errors;
  }

  // Create a new transaction with automatic electronic numbering
  async createTransaction(transactionData, userId) {
    try {
      // Validate input data
      const validationErrors = this.validateTransactionData(transactionData);
      if (validationErrors.length > 0) {
        throw new Error('خطأ في التحقق من البيانات: ' + validationErrors.join(', '));
      }

      const { company_id, transaction_type, amount, description, reference_number, transaction_date } = transactionData;

      // Prepare transaction data
      const transactionToSave = {
        company_id: parseInt(company_id),
        transaction_type: transaction_type.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        reference_number: reference_number ? reference_number.trim() : null,
        transaction_date: transaction_date,
        created_by: userId
      };

      // Save transaction (this will automatically generate electronic number)
      const savedTransaction = await this.database.saveTransaction(transactionToSave);

      return {
        success: true,
        message: 'تم حفظ المعاملة بنجاح',
        transaction: savedTransaction
      };
    } catch (error) {
      console.error('خطأ في إنشاء المعاملة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في إنشاء المعاملة',
        transaction: null
      };
    }
  }

  // Get transactions by company with pagination
  async getTransactionsByCompany(companyId, page = 1, limit = 50) {
    try {
      if (!companyId || isNaN(companyId)) {
        throw new Error('معرف الشركة غير صالح');
      }

      const offset = (page - 1) * limit;
      const transactions = await this.database.getTransactionsByCompany(companyId, limit, offset);

      return {
        success: true,
        message: 'تم جلب المعاملات بنجاح',
        transactions: transactions,
        pagination: {
          page: page,
          limit: limit,
          total: transactions.length
        }
      };
    } catch (error) {
      console.error('خطأ في جلب معاملات الشركة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب المعاملات',
        transactions: []
      };
    }
  }

  // Get transaction by electronic number
  async getTransactionByElectronicNumber(companyId, electronicNumber) {
    try {
      if (!companyId || isNaN(companyId)) {
        throw new Error('معرف الشركة غير صالح');
      }

      if (!electronicNumber || typeof electronicNumber !== 'string') {
        throw new Error('الرقم الإلكتروني غير صالح');
      }

      return new Promise((resolve, reject) => {
        const query = `
          SELECT t.*, u.name as created_by_name
          FROM transactions t
          LEFT JOIN users u ON t.created_by = u.id
          WHERE t.company_id = ? AND t.electronic_number = ?
        `;
        
        this.database.db.get(query, [companyId, electronicNumber], (err, row) => {
          if (err) {
            console.error('خطأ في جلب المعاملة بالرقم الإلكتروني:', err.message);
            reject({
              success: false,
              message: 'فشل في جلب المعاملة',
              transaction: null
            });
          } else if (row) {
            resolve({
              success: true,
              message: 'تم جلب المعاملة بنجاح',
              transaction: row
            });
          } else {
            resolve({
              success: false,
              message: 'المعاملة غير موجودة',
              transaction: null
            });
          }
        });
      });
    } catch (error) {
      console.error('خطأ في جلب المعاملة بالرقم الإلكتروني:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب المعاملة',
        transaction: null
      };
    }
  }

  // Get transaction statistics for a company
  async getTransactionStatistics(companyId, year = null) {
    try {
      if (!companyId || isNaN(companyId)) {
        throw new Error('معرف الشركة غير صالح');
      }

      if (!year) {
        year = new Date().getFullYear();
      }

      return new Promise((resolve, reject) => {
        const queries = {
          totalTransactions: `
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE company_id = ? AND strftime('%Y', transaction_date) = ?
          `,
          totalAmount: `
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE company_id = ? AND strftime('%Y', transaction_date) = ?
          `,
          transactionsByType: `
            SELECT transaction_type, COUNT(*) as count, SUM(amount) as total_amount
            FROM transactions 
            WHERE company_id = ? AND strftime('%Y', transaction_date) = ?
            GROUP BY transaction_type
          `,
          transactionsByMonth: `
            SELECT strftime('%m', transaction_date) as month, 
                   COUNT(*) as count, 
                   SUM(amount) as total_amount
            FROM transactions 
            WHERE company_id = ? AND strftime('%Y', transaction_date) = ?
            GROUP BY strftime('%m', transaction_date)
            ORDER BY month
          `
        };

        let completed = 0;
        let stats = { year: year };
        
        // Execute single value queries
        this.database.db.get(queries.totalTransactions, [companyId, year.toString()], (err, row) => {
          if (err) {
            reject(err);
          } else {
            stats.totalTransactions = row.count || 0;
            completed++;
            if (completed === 4) resolve({ success: true, statistics: stats });
          }
        });

        this.database.db.get(queries.totalAmount, [companyId, year.toString()], (err, row) => {
          if (err) {
            reject(err);
          } else {
            stats.totalAmount = row.total || 0;
            completed++;
            if (completed === 4) resolve({ success: true, statistics: stats });
          }
        });

        // Execute group by queries
        this.database.db.all(queries.transactionsByType, [companyId, year.toString()], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            stats.transactionsByType = rows;
            completed++;
            if (completed === 4) resolve({ success: true, statistics: stats });
          }
        });

        this.database.db.all(queries.transactionsByMonth, [companyId, year.toString()], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            stats.transactionsByMonth = rows;
            completed++;
            if (completed === 4) resolve({ success: true, statistics: stats });
          }
        });
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المعاملات:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في جلب إحصائيات المعاملات',
        statistics: {}
      };
    }
  }

  // Get available transaction types
  getTransactionTypes() {
    return [
      { value: 'sale', label: 'مبيعات', prefix: 'SAL' },
      { value: 'purchase', label: 'مشتريات', prefix: 'PUR' },
      { value: 'receipt', label: 'إيصال قبض', prefix: 'REC' },
      { value: 'payment', label: 'إيصال دفع', prefix: 'PAY' },
      { value: 'journal', label: 'قيد يومية', prefix: 'JOU' },
      { value: 'adjustment', label: 'قيد تسوية', prefix: 'ADJ' },
      { value: 'transfer', label: 'تحويل', prefix: 'TRF' },
      { value: 'expense', label: 'مصروف', prefix: 'EXP' },
      { value: 'income', label: 'إيراد', prefix: 'INC' },
      { value: 'refund', label: 'استرداد', prefix: 'REF' }
    ];
  }

  // Update transaction (limited fields only for data integrity)
  async updateTransaction(transactionId, companyId, updateData, userId) {
    try {
      // Only allow updating description and reference_number
      const allowedFields = ['description', 'reference_number'];
      const updates = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error('لا توجد حقول صالحة للتحديث');
      }

      return new Promise((resolve, reject) => {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(new Date().toISOString()); // updated_at
        values.push(transactionId);
        values.push(companyId);

        const query = `
          UPDATE transactions 
          SET ${setClause}, updated_at = ?
          WHERE id = ? AND company_id = ?
        `;
        
        this.database.db.run(query, values, function(err) {
          if (err) {
            console.error('خطأ في تحديث المعاملة:', err.message);
            reject({
              success: false,
              message: 'فشل في تحديث المعاملة'
            });
          } else if (this.changes === 0) {
            resolve({
              success: false,
              message: 'المعاملة غير موجودة أو لا تملك صلاحية تحديثها'
            });
          } else {
            resolve({
              success: true,
              message: 'تم تحديث المعاملة بنجاح'
            });
          }
        });
      });
    } catch (error) {
      console.error('خطأ في تحديث المعاملة:', error.message);
      return {
        success: false,
        message: error.message || 'فشل في تحديث المعاملة'
      };
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = TransactionService;