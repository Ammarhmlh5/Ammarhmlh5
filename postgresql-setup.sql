-- قاعدة بيانات PostgreSQL لنظام إدارة المستخدمين والشركات متعدد الاستأجار
-- PostgreSQL Database Setup for Multi-Tenant User and Company Management System

-- إنشاء قاعدة البيانات الرئيسية
-- CREATE DATABASE user_management_system;

-- الاتصال بقاعدة البيانات
-- \c user_management_system;

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. جدول الشركات مع معلومات الاشتراك
-- Companies table with subscription information
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    description TEXT,
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    subscription_plan VARCHAR(20) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'standard', 'premium', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 1000,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول المستخدمين مع العلاقات متعددة الشركات
-- Users table with multi-company relationships
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(50),
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    can_access_multiple_companies BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول صلاحيات الوصول للشركات المتعددة
-- User company access table for multi-company permissions
CREATE TABLE user_company_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

-- 4. جدول عدادات الأرقام الإلكترونية
-- Transaction counters table for unique electronic numbers
CREATE TABLE transaction_counters (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    current_number INTEGER DEFAULT 0,
    prefix VARCHAR(10) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, year, transaction_type)
);

-- 5. جدول المعاملات المالية
-- Financial transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    electronic_number VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    transaction_date DATE NOT NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, electronic_number)
);

-- 6. جدول دليل الحسابات مع عزل الشركات
-- Chart of accounts table with company isolation
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, account_code)
);

-- 7. جدول المشتركين
-- Subscribers table for customer management
CREATE TABLE subscribers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    business_type VARCHAR(50),
    meter_system_type VARCHAR(50),
    tariff_type VARCHAR(100),
    tariff_group VARCHAR(50),
    id_card_number VARCHAR(50),
    photo_path VARCHAR(500),
    property_ownership VARCHAR(10) CHECK (property_ownership IN ('ملك', 'إيجار')),
    connection_amount DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, account_number)
);

-- 8. جدول سجلات المدير للمراقبة
-- Admin logs table for monitoring
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    affected_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول إعدادات الإشعارات المالية
-- Notification settings table for financial messaging configuration
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    channels JSONB NOT NULL DEFAULT '["sms"]',
    send_to_subscriber BOOLEAN DEFAULT TRUE,
    send_to_company BOOLEAN DEFAULT FALSE,
    auto_send BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, transaction_type)
);

-- 10. جدول قوالب الرسائل القابلة للتخصيص
-- Message templates table for customizable templates
CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. جدول سجلات الإشعارات لتتبع التسليم
-- Notification logs table for delivery tracking
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES message_templates(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس لتحسين الأداء
-- Create indexes for performance optimization

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_subscription_status ON companies(subscription_status);

CREATE INDEX idx_user_company_access_user_id ON user_company_access(user_id);
CREATE INDEX idx_user_company_access_company_id ON user_company_access(company_id);

CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_electronic_number ON transactions(electronic_number);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);

CREATE INDEX idx_accounts_company_id ON accounts(company_id);
CREATE INDEX idx_accounts_account_code ON accounts(account_code);
CREATE INDEX idx_accounts_account_type ON accounts(account_type);

CREATE INDEX idx_subscribers_company_id ON subscribers(company_id);
CREATE INDEX idx_subscribers_account_number ON subscribers(account_number);
CREATE INDEX idx_subscribers_phone ON subscribers(phone);

CREATE INDEX idx_transaction_counters_company_year_type ON transaction_counters(company_id, year, transaction_type);

CREATE INDEX idx_admin_logs_company_id ON admin_logs(company_id);
CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

CREATE INDEX idx_notification_logs_company_id ON notification_logs(company_id);
CREATE INDEX idx_notification_logs_transaction_id ON notification_logs(transaction_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- إنشاء دوال التحديث التلقائي للوقت
-- Create automatic timestamp update functions

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إضافة محفزات التحديث التلقائي
-- Add automatic update triggers

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_counters_updated_at BEFORE UPDATE ON transaction_counters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء بيانات تجريبية (اختياري)
-- Create sample data (optional)

-- إدراج شركة تجريبية
INSERT INTO companies (name, email, phone, address, description) 
VALUES ('الشركة التجريبية', 'demo@company.com', '+964123456789', 'بغداد، العراق', 'شركة تجريبية لاختبار النظام');

-- إدراج مستخدم إداري تجريبي
INSERT INTO users (name, email, password, company_id, role) 
VALUES ('المدير العام', 'admin@company.com', '$2b$10$example_hashed_password', 1, 'admin');

-- رسالة تأكيد
SELECT 'تم إنشاء قاعدة البيانات وجميع الجداول بنجاح - Database and all tables created successfully' AS status;