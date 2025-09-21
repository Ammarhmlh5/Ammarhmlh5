const Database = require('./database');

class CompanyMiddleware {
  constructor() {
    this.database = new Database();
  }

  async init() {
    await this.database.init();
  }

  // Middleware to ensure user is authenticated and has company context
  requireAuth() {
    return (req, res, next) => {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        });
      }
      next();
    };
  }

  // Middleware to ensure user has access to specific company
  requireCompanyAccess() {
    return async (req, res, next) => {
      try {
        if (!req.session.user) {
          return res.status(401).json({
            success: false,
            message: 'يجب تسجيل الدخول أولاً'
          });
        }

        // Get company ID from session or request
        const companyId = req.session.currentCompanyId || req.body.company_id || req.params.companyId;
        
        if (!companyId) {
          return res.status(400).json({
            success: false,
            message: 'معرف الشركة مطلوب'
          });
        }

        // Check if user has access to this company
        const hasAccess = await this.checkUserCompanyAccess(req.session.user.id, companyId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'لا تملك صلاحية للوصول إلى هذه الشركة'
          });
        }

        // Add company context to request
        req.companyId = companyId;
        next();
      } catch (error) {
        console.error('خطأ في فحص صلاحية الشركة:', error.message);
        res.status(500).json({
          success: false,
          message: 'خطأ في فحص صلاحية الوصول'
        });
      }
    };
  }

  // Middleware to check admin role
  requireAdminRole() {
    return (req, res, next) => {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        });
      }

      if (req.session.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'يجب أن تكون مديراً للوصول إلى هذه الصفحة'
        });
      }

      next();
    };
  }

  // Middleware for system admin (for subscription management)
  requireSystemAdmin() {
    return (req, res, next) => {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        });
      }

      if (req.session.user.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          message: 'يجب أن تكون مدير النظام للوصول إلى هذه الصفحة'
        });
      }

      next();
    };
  }

  // Automatically filter queries by company ID
  injectCompanyFilter() {
    return (req, res, next) => {
      if (req.session.user && req.session.currentCompanyId) {
        // Add company filter to query parameters
        req.query.company_id = req.session.currentCompanyId;
        
        // Add company filter to body if it's a POST/PUT request
        if (req.method === 'POST' || req.method === 'PUT') {
          req.body.company_id = req.session.currentCompanyId;
        }
      }
      next();
    };
  }

  // Check if user has access to company
  async checkUserCompanyAccess(userId, companyId) {
    try {
      // Check if user's primary company
      const user = await this.database.getUserById(userId);
      if (user && user.company_id == companyId) {
        return true;
      }

      // Check if user has additional access through user_company_access table
      const accessibleCompanies = await this.database.getUserAccessibleCompanies(userId);
      return accessibleCompanies.some(company => company.id == companyId);
    } catch (error) {
      console.error('خطأ في فحص صلاحية الوصول للشركة:', error.message);
      return false;
    }
  }

  // Set current company context
  async setCompanyContext(req, res, next) {
    try {
      const { companyId } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'معرف الشركة مطلوب'
        });
      }

      // Verify user has access to this company
      const hasAccess = await this.checkUserCompanyAccess(req.session.user.id, companyId);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'لا تملك صلاحية للوصول إلى هذه الشركة'
        });
      }

      // Set company context in session
      req.session.currentCompanyId = companyId;
      
      // Get company details
      const company = await this.database.getCompanyById(companyId);
      req.session.currentCompany = company;

      res.json({
        success: true,
        message: 'تم تغيير سياق الشركة بنجاح',
        company: company
      });
    } catch (error) {
      console.error('خطأ في تعيين سياق الشركة:', error.message);
      res.status(500).json({
        success: false,
        message: 'خطأ في تعيين سياق الشركة'
      });
    }
  }

  // Log admin actions
  async logAction(adminUserId, companyId, actionType, description, affectedUserId = null, metadata = null) {
    try {
      await this.database.logAdminAction({
        company_id: companyId,
        admin_user_id: adminUserId,
        action_type: actionType,
        description: description,
        affected_user_id: affectedUserId,
        metadata: metadata
      });
    } catch (error) {
      console.error('خطأ في تسجيل إجراء المدير:', error.message);
    }
  }

  // Close database connection
  close() {
    this.database.close();
  }
}

module.exports = CompanyMiddleware;