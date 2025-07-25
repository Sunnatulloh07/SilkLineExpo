/**
 * Email Service
 * Handles all email notifications and communications
 */

class EmailService {
  constructor() {
    this.emailEnabled = process.env.SMTP_HOST && process.env.SMTP_USER;
    this.fromEmail = process.env.SMTP_USER || 'noreply@slex.uz';
    this.appName = process.env.APP_NAME || 'SLEX - Silk Line Expo';
    this.appUrl = process.env.APP_URL || 'http://localhost:3005';
  }

  /**
   * Initialize email service (setup nodemailer if needed)
   */
  async initialize() {
    if (!this.emailEnabled) {
      console.warn('Email service disabled - SMTP configuration not found');
      return;
    }

    try {
      // Initialize nodemailer transporter
      // const nodemailer = require('nodemailer');
      // this.transporter = nodemailer.createTransporter({
      //   host: process.env.SMTP_HOST,
      //   port: process.env.SMTP_PORT || 587,
      //   secure: false,
      //   auth: {
      //     user: process.env.SMTP_USER,
      //     pass: process.env.SMTP_PASS
      //   }
      // });
      
      console.log('Email service initialized');
    } catch (error) {
      console.error('Email service initialization error:', error);
    }
  }

  /**
   * Send welcome email to new registrants
   */
  async sendWelcomeEmail(email, data) {
    try {
      const subject = `Welcome to ${this.appName} - Registration Received`;
      const html = this.generateWelcomeEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Welcome email error:', error);
      throw error;
    }
  }

  /**
   * Send admin notification for new registrations
   */
  async sendAdminNotification(type, data) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) return;

      let subject, html;
      
      switch (type) {
        case 'new_registration':
          subject = `New Company Registration - ${data.companyName}`;
          html = this.generateAdminNotificationTemplate(data);
          break;
        default:
          return;
      }

      for (const adminEmail of adminEmails) {
        await this.sendEmail(adminEmail, subject, html);
      }

    } catch (error) {
      console.error('Admin notification error:', error);
      // Don't throw error for admin notifications
    }
  }

  /**
   * Send approval email to approved users
   */
  async sendApprovalEmail(email, data) {
    try {
      const subject = `Account Approved - Welcome to ${this.appName}`;
      const html = this.generateApprovalEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Approval email error:', error);
      throw error;
    }
  }

  /**
   * Send rejection email to rejected users
   */
  async sendRejectionEmail(email, data) {
    try {
      const subject = `Registration Update - ${this.appName}`;
      const html = this.generateRejectionEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Rejection email error:', error);
      throw error;
    }
  }

  /**
   * Send suspension email
   */
  async sendSuspensionEmail(email, data) {
    try {
      const subject = `Account Suspended - ${this.appName}`;
      const html = this.generateSuspensionEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Suspension email error:', error);
      throw error;
    }
  }

  /**
   * Send reactivation email
   */
  async sendReactivationEmail(email, data) {
    try {
      const subject = `Account Reactivated - ${this.appName}`;
      const html = this.generateReactivationEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Reactivation email error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, data) {
    try {
      const subject = `Password Reset - ${this.appName}`;
      const html = this.generatePasswordResetEmailTemplate(data);
      
      return await this.sendEmail(email, subject, html);
    } catch (error) {
      console.error('Password reset email error:', error);
      throw error;
    }
  }

  /**
   * Core email sending function
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.emailEnabled) {
        console.log(`[EMAIL DISABLED] To: ${to}, Subject: ${subject}`);
        return { success: true, message: 'Email service disabled' };
      }

      // For now, just log the email
      console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
      console.log(`[EMAIL CONTENT] ${html.substring(0, 200)}...`);

      // TODO: Implement actual email sending with nodemailer
      // const mailOptions = {
      //   from: this.fromEmail,
      //   to: to,
      //   subject: subject,
      //   html: html,
      //   text: text || this.htmlToText(html)
      // };
      // 
      // const result = await this.transporter.sendMail(mailOptions);
      // return { success: true, messageId: result.messageId };

      return { success: true, message: 'Email logged (not sent)' };

    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  /**
   * Get admin email addresses
   */
  async getAdminEmails() {
    try {
      const Admin = require('../models/Admin');
      const admins = await Admin.find({ 
        status: 'active',
        role: { $in: ['super_admin', 'admin'] }
      }).select('email');
      
      return admins.map(admin => admin.email);
    } catch (error) {
      console.error('Get admin emails error:', error);
      return [];
    }
  }

  /**
   * Generate welcome email template
   */
  generateWelcomeEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Registration Received</h2>
            <p>Dear ${data.companyName},</p>
            <p>Thank you for registering with ${this.appName}. We have received your company registration and it is currently under review by our administrators.</p>
            
            <h3>What happens next?</h3>
            <ul>
              <li>Our admin team will review your registration details</li>
              <li>You'll receive an email notification once your account is approved</li>
              <li>Approval typically takes 1-3 business days</li>
            </ul>
            
            <p>If you have any urgent questions, please contact our support team.</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate admin notification template
   */
  generateAdminNotificationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Registration - ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table th, .info-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          .info-table th { background: #f3f4f6; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Company Registration</h1>
          </div>
          <div class="content">
            <h2>Registration Details</h2>
            <table class="info-table">
              <tr><th>Company Name</th><td>${data.companyName}</td></tr>
              <tr><th>Email</th><td>${data.email}</td></tr>
              <tr><th>Country</th><td>${data.country}</td></tr>
              <tr><th>Activity Type</th><td>${data.activityType}</td></tr>
              <tr><th>Registration Date</th><td>${new Date(data.registrationDate).toLocaleString()}</td></tr>
            </table>
            
            <p>Please review and approve/reject this registration in the admin panel.</p>
            
            <a href="${this.appUrl}/admin/pending-approvals" class="button">Review Registration</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate approval email template
   */
  generateApprovalEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Approved - ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Approved!</h1>
          </div>
          <div class="content">
            <h2>Welcome to ${this.appName}</h2>
            <p>Dear ${data.companyName},</p>
            <p>Great news! Your company registration has been approved by our administrator ${data.approvedBy}.</p>
            
            <p>You can now access all features of our B2B platform:</p>
            <ul>
              <li>List your products and services</li>
              <li>Connect with buyers and suppliers</li>
              <li>Manage your business profile</li>
              <li>Access our CRM tools</li>
            </ul>
            
            <p>Click the button below to log in to your account:</p>
            <a href="${data.loginUrl}" class="button">Login to Your Account</a>
            
            <p>If you have any questions, our support team is here to help.</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate rejection email template
   */
  generateRejectionEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Registration Update - ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reason-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Update</h1>
          </div>
          <div class="content">
            <h2>Registration Status</h2>
            <p>Dear ${data.companyName},</p>
            <p>Thank you for your interest in ${this.appName}. After reviewing your registration, we are unable to approve your account at this time.</p>
            
            <div class="reason-box">
              <h3>Reason for rejection:</h3>
              <p>${data.rejectionReason}</p>
            </div>
            
            <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team at ${data.supportEmail}.</p>
            
            <p>We appreciate your understanding.</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate suspension email template
   */
  generateSuspensionEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Suspended - ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reason-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Suspended</h1>
          </div>
          <div class="content">
            <h2>Account Status Update</h2>
            <p>Dear ${data.companyName},</p>
            <p>Your account has been suspended by our administrator.</p>
            
            <div class="reason-box">
              <h3>Reason for suspension:</h3>
              <p>${data.suspensionReason}</p>
            </div>
            
            <p>To reactivate your account, please contact our support team at ${data.supportEmail} with any relevant information or clarifications.</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate reactivation email template
   */
  generateReactivationEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Reactivated - ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Reactivated</h1>
          </div>
          <div class="content">
            <h2>Welcome Back!</h2>
            <p>Dear ${data.companyName},</p>
            <p>Your account has been reactivated by our administrator ${data.reactivatedBy}.</p>
            
            <p>You can now access your account and use all platform features again.</p>
            
            <a href="${data.loginUrl}" class="button">Login to Your Account</a>
            
            <p>Thank you for your patience.</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset email template
   */
  generatePasswordResetEmailTemplate(data) {
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${data.resetToken}&type=${data.userType}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Dear ${data.name},</p>
            <p>We received a request to reset your password for your ${this.appName} account.</p>
            
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 15 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

module.exports = new EmailService();