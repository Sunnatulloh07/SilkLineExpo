/**
 * Professional Notification Service
 * Senior Software Engineer level implementation
 * Handles all notification delivery channels (Email, SMS, Push, In-App)
 */

const Notification = require('../models/Notification');
const EmailService = require('./EmailService');

class NotificationService {
    constructor() {
        this.logger = console;
        this.retryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    /**
     * Create and send order comment notification
     */
    async createOrderCommentNotification(data) {
        try {
            const {
                orderId,
                commentId,
                commentContent,
                commentType,
                priority,
                recipientId,
                recipientModel = 'User',
                senderId,
                senderModel = 'User',
                orderNumber,
                senderName,
                channels = { email: true, push: true, inApp: true },
                isUpdate = false
            } = data;

            this.logger.log(`📧 Creating order comment notification for order ${orderNumber}`);

            // Create notification in database
            const notification = await Notification.createOrderCommentNotification({
                recipientId,
                recipientModel,
                senderId,
                senderModel,
                orderId,
                commentId,
                orderNumber,
                commentContent,
                priority,
                isUpdate
            });

            // Configure delivery channels
            notification.channels.email.enabled = channels.email || false;
            notification.channels.push.enabled = channels.push || false;
            notification.channels.inApp.enabled = channels.inApp || true; // Always enable in-app
            
            await notification.save();

            // Send notifications through enabled channels
            await this.deliverNotification(notification, {
                senderName,
                commentType
            });

            this.logger.log(`✅ Order comment notification created: ${notification._id}`);
            return notification;

        } catch (error) {
            this.logger.error('❌ Error creating order comment notification:', error);
            throw error;
        }
    }

    /**
     * Deliver notification through all enabled channels
     */
    async deliverNotification(notification, context = {}) {
        const deliveryPromises = [];

        try {
            // Email delivery
            if (notification.channels.email.enabled) {
                deliveryPromises.push(this.sendEmailNotification(notification, context));
            }

            // SMS delivery
            if (notification.channels.sms.enabled) {
                deliveryPromises.push(this.sendSMSNotification(notification, context));
            }

            // Push notification delivery
            if (notification.channels.push.enabled) {
                deliveryPromises.push(this.sendPushNotification(notification, context));
            }

            // In-app notification (always enabled, just mark as available)
            if (notification.channels.inApp.enabled) {
                notification.channels.inApp.shown = true;
                notification.channels.inApp.shownAt = new Date();
            }

            // Wait for all deliveries to complete
            const results = await Promise.allSettled(deliveryPromises);
            
            // Update notification status based on results
            const hasSuccess = results.some(result => result.status === 'fulfilled');
            notification.status = hasSuccess ? 'delivered' : 'failed';
            notification.attempts = (notification.attempts || 0) + 1;
            notification.lastAttemptAt = new Date();

            await notification.save();

            this.logger.log(`📬 Notification delivery completed: ${notification._id}`);
            return notification;

        } catch (error) {
            this.logger.error('❌ Error delivering notification:', error);
            notification.status = 'failed';
            notification.attempts = (notification.attempts || 0) + 1;
            notification.lastAttemptAt = new Date();
            await notification.save();
            throw error;
        }
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(notification, context = {}) {
        try {
            // Get recipient details
            const recipient = await this.getRecipientDetails(notification.recipient, notification.recipientModel);
            
            if (!recipient || !recipient.email) {
                throw new Error('Recipient email not found');
            }

            // Create email HTML content
            const emailHtml = this.generateNotificationEmailHTML({
                recipientName: recipient.name || recipient.companyName,
                title: notification.title,
                message: notification.message,
                orderNumber: notification.metadata.orderNumber,
                commentContent: context.commentContent || notification.message,
                senderName: context.senderName,
                actionUrl: `${process.env.BASE_URL || 'http://localhost:3000'}${notification.metadata.actionUrl}`,
                unsubscribeUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/notifications/unsubscribe?token=${recipient._id}`
            });

            // Send email using EmailService (correct signature)
            const result = await EmailService.sendEmail(
                recipient.email,
                notification.title,
                emailHtml
            );
            
            // Update delivery status
            await notification.updateDeliveryStatus('email', true);
            
            this.logger.log(`📧 Email notification sent: ${notification._id}`);
            return result;

        } catch (error) {
            await notification.updateDeliveryStatus('email', false, error.message);
            this.logger.error(`❌ Email notification failed: ${notification._id}`, error);
            throw error;
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification, context = {}) {
        try {
            // SMS implementation placeholder
            // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
            
            const recipient = await this.getRecipientDetails(notification.recipient, notification.recipientModel);
            
            if (!recipient || !recipient.phone) {
                throw new Error('Recipient phone number not found');
            }

            const smsText = `${notification.title}\n${notification.message}\nBuyurtma: ${notification.metadata.orderNumber}`;

            // TODO: Implement actual SMS sending
            this.logger.log(`📱 SMS notification (simulated): ${recipient.phone} - ${smsText}`);
            
            // Simulate successful delivery
            await notification.updateDeliveryStatus('sms', true);
            return { success: true, messageId: 'sim_' + Date.now() };

        } catch (error) {
            await notification.updateDeliveryStatus('sms', false, error.message);
            this.logger.error(`❌ SMS notification failed: ${notification._id}`, error);
            throw error;
        }
    }

    /**
     * Send push notification
     */
    async sendPushNotification(notification, context = {}) {
        try {
            // Push notification implementation placeholder
            // In production, integrate with push service (Firebase, Apple Push, etc.)
            
            const pushData = {
                title: notification.title,
                body: notification.message,
                data: {
                    type: notification.type,
                    orderId: notification.relatedOrder,
                    actionUrl: notification.metadata.actionUrl
                }
            };

            // TODO: Implement actual push notification sending
            this.logger.log(`🔔 Push notification (simulated): ${JSON.stringify(pushData)}`);
            
            // Simulate successful delivery
            await notification.updateDeliveryStatus('push', true);
            return { success: true, messageId: 'push_' + Date.now() };

        } catch (error) {
            await notification.updateDeliveryStatus('push', false, error.message);
            this.logger.error(`❌ Push notification failed: ${notification._id}`, error);
            throw error;
        }
    }

    /**
     * Get recipient details from database
     */
    async getRecipientDetails(recipientId, recipientModel) {
        try {
            const Model = recipientModel === 'Admin' ? 
                require('../models/Admin') : 
                require('../models/User');
            
            const recipient = await Model.findById(recipientId)
                .select('name email phone companyName')
                .lean();
            
            return recipient;
        } catch (error) {
            this.logger.error('❌ Error getting recipient details:', error);
            throw error;
        }
    }

    /**
     * Get unread notifications for a user
     */
    async getUnreadNotifications(recipientId, options = {}) {
        try {
            const notifications = await Notification.getNotificationsByRecipient(recipientId, {
                ...options,
                isRead: false
            });
            
            return notifications;
        } catch (error) {
            this.logger.error('❌ Error getting unread notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, recipientId) {
        try {
            const notification = await Notification.markAsRead(notificationId, recipientId);
            return notification;
        } catch (error) {
            this.logger.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Get unread count for recipient
     */
    async getUnreadCount(recipientId) {
        try {
            const count = await Notification.getUnreadCount(recipientId);
            return count;
        } catch (error) {
            this.logger.error('❌ Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Retry failed notifications
     */
    async retryFailedNotifications() {
        try {
            const failedNotifications = await Notification.find({
                status: 'failed',
                attempts: { $lt: this.retryAttempts },
                $or: [
                    { nextAttemptAt: { $lte: new Date() } },
                    { nextAttemptAt: { $exists: false } }
                ]
            }).limit(100);

            this.logger.log(`🔄 Retrying ${failedNotifications.length} failed notifications`);

            for (const notification of failedNotifications) {
                try {
                    await this.deliverNotification(notification);
                } catch (error) {
                    this.logger.error(`❌ Retry failed for notification ${notification._id}:`, error);
                }
            }

            return failedNotifications.length;
        } catch (error) {
            this.logger.error('❌ Error retrying failed notifications:', error);
            throw error;
        }
    }

    /**
     * Clean up old notifications
     */
    async cleanupOldNotifications(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await Notification.deleteMany({
                createdAt: { $lt: cutoffDate },
                'readStatus.isRead': true
            });

            this.logger.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
            return result.deletedCount;
        } catch (error) {
            this.logger.error('❌ Error cleaning up old notifications:', error);
            throw error;
        }
    }

    /**
     * Generate professional email HTML template
     */
    generateNotificationEmailHTML(data) {
        const {
            recipientName,
            title,
            message,
            orderNumber,
            commentContent,
            senderName,
            actionUrl,
            unsubscribeUrl
        } = data;

        return `
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .notification-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .order-info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .comment-content { background-color: #ffffff; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; margin: 10px 0; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 SLEX - Yangi Bildirishnoma</h1>
            <p>Silk Line Expo B2B Platform</p>
        </div>
        
        <div class="content">
            <h2>Salom, ${recipientName}!</h2>
            
            <div class="notification-box">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
            
            ${orderNumber ? `
            <div class="order-info">
                <strong>📦 Buyurtma raqami:</strong> ${orderNumber}<br>
                <strong>👤 Yuboruvchi:</strong> ${senderName || 'Tizim'}
            </div>
            ` : ''}
            
            ${commentContent ? `
            <div class="comment-content">
                <strong>💬 Izoh matni:</strong><br>
                "${commentContent}"
            </div>
            ` : ''}
            
            ${actionUrl ? `
            <div style="text-align: center;">
                <a href="${actionUrl}" class="button">Buyurtmani Ko'rish</a>
            </div>
            ` : ''}
            
            <p><small>Bu bildirishnoma avtomatik yuborilgan. Iltimos, javob bermang.</small></p>
        </div>
        
        <div class="footer">
            <p>© 2025 SLEX - Silk Line Expo. Barcha huquqlar himoyalangan.</p>
            ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Obunani bekor qilish</a></p>` : ''}
        </div>
    </div>
</body>
</html>
        `.trim();
    }
}

module.exports = new NotificationService();
