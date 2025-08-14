/**
 * Inquiry Controller
 * Professional B2B inquiries management with Alibaba-style business logic
 */

const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const Product = require('../models/Product');

class InquiryController {
    constructor() {
        this.logger = console;
    }

    /**
     * Show inquiries page
     */
    async showInquiriesPage(req, res) {
        try {
            const manufacturerId = req.user.userId;
            this.logger.log(`🏭 Loading inquiries page for manufacturer: ${manufacturerId}`);

            // Get initial inquiries data
            const inquiriesData = await this.getInquiriesData(manufacturerId, req.query);

            res.render('manufacturer/inquiries/index', {
                title: 'Biznes So\'rovlari',
                currentPage: 'inquiries',
                user: req.user,
                inquiries: inquiriesData.inquiries,
                pagination: inquiriesData.pagination,
                filters: inquiriesData.filters
            });

        } catch (error) {
            this.logger.error('❌ Show inquiries page error:', error);
            res.status(500).render('error/500', {
                title: 'Server Error',
                message: 'Inquiries sahifasini yuklashda xatolik yuz berdi'
            });
        }
    }

    /**
     * API: Get inquiries list
     */
    async getInquiriesList(req, res) {
        try {
            const manufacturerId = req.user.userId;
            this.logger.log(`📡 API: Getting inquiries list for manufacturer: ${manufacturerId}`);

            const inquiriesData = await this.getInquiriesData(manufacturerId, req.query);

            res.json({
                success: true,
                inquiries: inquiriesData.inquiries,
                pagination: inquiriesData.pagination,
                filters: inquiriesData.filters,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get inquiries list API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get inquiries list',
                message: error.message
            });
        }
    }

    /**
     * API: Get inquiries statistics
     */
    async getInquiriesStats(req, res) {
        try {
            const manufacturerId = req.user.userId;
            this.logger.log(`📊 API: Getting inquiries stats for manufacturer: ${manufacturerId}`);

            const stats = await this.getInquiriesStatistics(manufacturerId);

            res.json({
                success: true,
                ...stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get inquiries stats API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get inquiries statistics',
                message: error.message
            });
        }
    }

    /**
     * API: Respond to inquiry
     */
    async respondToInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            let { responseType, message, quoteDetails, followUp, attachments } = req.body;
            const manufacturerId = req.user.userId;
            
            // Parse quoteDetails if it's a JSON string (from FormData)
            if (typeof quoteDetails === 'string') {
                try {
                    quoteDetails = JSON.parse(quoteDetails);
                } catch (error) {
                    this.logger.warn('Failed to parse quoteDetails:', error.message);
                    quoteDetails = null;
                }
            }

            this.logger.log(`💬 API: Responding to inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);
            this.logger.log(`📊 Request data:`, { responseType, message, quoteDetails, followUp, attachments });

            // Validate required fields
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required',
                    message: 'Javob matni kiritilishi shart'
                });
            }

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check if manufacturer is the supplier for this inquiry
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Process file attachments
            const processedAttachments = [];
            if (req.files && req.files.length > 0) {
                this.logger.log(`📎 Processing ${req.files.length} attachments...`);
                
                for (const file of req.files) {
                    // For now, just store file metadata
                    // In production, you would save files to storage and get URLs
                    const attachment = {
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: `/uploads/inquiries/${inquiryId}/${file.originalname}`, // placeholder URL
                        uploadedAt: new Date()
                    };
                    
                    processedAttachments.push(attachment);
                    this.logger.log(`📎 Processed attachment: ${file.originalname} (${file.mimetype})`);
                }
            } else if (attachments && attachments.length > 0) {
                // Handle attachments from JSON (if any)
                processedAttachments.push(...attachments);
            }
            
            // Add response message
            const isQuote = responseType === 'detailed_quote';
            await inquiry.addMessage(
                manufacturerId,
                message.trim(),
                processedAttachments,
                isQuote,
                isQuote ? quoteDetails : null
            );

            // Add quote if it's a quote response
            if (isQuote && quoteDetails) {
                // Validate quote details
                if (!quoteDetails.unitPrice || quoteDetails.unitPrice <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Valid unit price is required for quotes'
                    });
                }

                await inquiry.addQuote(
                    manufacturerId,
                    quoteDetails.unitPrice,
                    quoteDetails.totalPrice,
                    quoteDetails.currency || 'USD',
                    quoteDetails.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                    quoteDetails.terms || '',
                    quoteDetails.notes || ''
                );
            }

            // Schedule follow-up if requested
            if (followUp && followUp.enabled) {
                await inquiry.scheduleFollowUp(followUp.days);
            }

            this.logger.log(`✅ Response added successfully to inquiry ${inquiryId}`);

            res.json({
                success: true,
                message: 'Response sent successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Respond to inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send response',
                message: error.message
            });
        }
    }

    /**
     * API: Send quick quote
     */
    async sendQuickQuote(req, res) {
        try {
            const { inquiryId } = req.params;
            const { unitPrice, totalPrice, note } = req.body;
            const manufacturerId = req.user.userId;

            this.logger.log(`⚡ API: Sending quick quote for inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Add quick quote
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 14); // 14 days validity

            await inquiry.addQuote(
                manufacturerId,
                unitPrice,
                totalPrice,
                'USD',
                validUntil,
                'Quick quote - standard terms apply',
                note
            );

            res.json({
                success: true,
                message: 'Quick quote sent successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Send quick quote API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send quick quote',
                message: error.message
            });
        }
    }

    /**
     * API: Get single inquiry
     */
    async getInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            const manufacturerId = req.user.userId;

            this.logger.log(`📋 API: Getting inquiry ${inquiryId} for manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId)
                .populate('inquirer', 'companyName name email phone country')
                .populate('product', 'title name category images')
                .lean();

            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            res.json({
                success: true,
                inquiry: await this.formatInquiryResponse(inquiry),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get inquiry',
                message: error.message
            });
        }
    }

    /**
     * API: Update inquiry status
     */
    async updateInquiryStatus(req, res) {
        try {
            const { inquiryId } = req.params;
            const { status, priority } = req.body;
            const manufacturerId = req.user.userId;

            this.logger.log(`🔄 API: Updating inquiry ${inquiryId} status by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Update fields
            if (status) inquiry.status = status;
            if (priority) inquiry.priority = priority;

            await inquiry.save();

            res.json({
                success: true,
                message: 'Inquiry updated successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Update inquiry status API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update inquiry',
                message: error.message
            });
        }
    }

    /**
     * Get inquiries data with filters and pagination
     */
    async getInquiriesData(manufacturerId, queryParams = {}) {
        const page = parseInt(queryParams.page) || 1;
        const limit = parseInt(queryParams.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query
        const query = { supplier: manufacturerId };

        // Apply filters
        if (queryParams.search) {
            const searchRegex = new RegExp(queryParams.search, 'i');
            query.$or = [
                { subject: searchRegex },
                { message: searchRegex },
                { inquiryNumber: searchRegex }
            ];
        }

        if (queryParams.status) {
            query.status = queryParams.status;
        }

        if (queryParams.priority) {
            query.priority = queryParams.priority;
        }

        if (queryParams.dateRange) {
            const dateFilter = this.buildDateFilter(queryParams.dateRange);
            if (dateFilter) {
                query.createdAt = dateFilter;
            }
        }

        if (queryParams.budget) {
            const budgetFilter = this.buildBudgetFilter(queryParams.budget);
            if (budgetFilter) {
                query['budgetRange.min'] = budgetFilter;
            }
        }

        // Sorting
        const sortField = queryParams.sortBy || 'createdAt';
        const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        // Execute query
        const [inquiries, totalCount] = await Promise.all([
            Inquiry.find(query)
                .populate('inquirer', 'companyName name email phone country')
                .populate('product', 'title name category images')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Inquiry.countDocuments(query)
        ]);

        // Format inquiries
        const formattedInquiries = await Promise.all(
            inquiries.map(inquiry => this.formatInquiryResponse(inquiry))
        );

        return {
            inquiries: formattedInquiries,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1
            },
            filters: queryParams
        };
    }

    /**
     * Get inquiries statistics
     */
    async getInquiriesStatistics(manufacturerId) {
        const [
            totalInquiries,
            newInquiries,
            respondedInquiries,
            convertedInquiries
        ] = await Promise.all([
            Inquiry.countDocuments({ supplier: manufacturerId }),
            Inquiry.countDocuments({ 
                supplier: manufacturerId, 
                status: 'open',
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),
            Inquiry.countDocuments({ 
                supplier: manufacturerId, 
                status: { $in: ['responded', 'quoted', 'negotiating'] }
            }),
            Inquiry.countDocuments({ 
                supplier: manufacturerId, 
                status: 'converted'
            })
        ]);

        const responseRate = totalInquiries > 0 
            ? Math.round((respondedInquiries / totalInquiries) * 100) 
            : 0;

        const conversionRate = totalInquiries > 0 
            ? Math.round((convertedInquiries / totalInquiries) * 100) 
            : 0;

        return {
            totalInquiries,
            newInquiries,
            responseRate,
            conversionRate
        };
    }

    /**
     * Format inquiry for response
     */
    async formatInquiryResponse(inquiry) {
        return {
            _id: inquiry._id,
            inquiryNumber: inquiry.inquiryNumber,
            type: inquiry.type,
            subject: inquiry.subject,
            message: inquiry.message,
            requestedQuantity: inquiry.requestedQuantity,
            unit: inquiry.unit,
            budgetRange: inquiry.budgetRange,
            status: inquiry.status,
            priority: inquiry.priority,
            isUrgent: inquiry.priority === 'urgent',
            createdAt: inquiry.createdAt,
            updatedAt: inquiry.updatedAt,
            inquirer: inquiry.inquirer,
            product: inquiry.product,
            quotes: inquiry.quotes,
            messages: inquiry.messages
        };
    }

    /**
     * Build date filter for queries
     */
    buildDateFilter(dateRange) {
        const now = new Date();
        let startDate;

        switch (dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return { $gte: startDate };
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return { $gte: startDate };
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                return { $gte: startDate };
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                return { $gte: startDate };
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                return { $gte: startDate };
            default:
                return null;
        }
    }

    /**
     * Build budget filter for queries
     */
    buildBudgetFilter(budget) {
        switch (budget) {
            case '0-1000':
                return { $gte: 0, $lte: 1000 };
            case '1000-5000':
                return { $gte: 1000, $lte: 5000 };
            case '5000-10000':
                return { $gte: 5000, $lte: 10000 };
            case '10000-50000':
                return { $gte: 10000, $lte: 50000 };
            case '50000+':
                return { $gte: 50000 };
            default:
                return null;
        }
    }

    /**
     * API: Archive inquiry
     */
    async archiveInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            const manufacturerId = req.user.userId;

            this.logger.log(`📦 API: Archiving inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Add archive tag
            if (!inquiry.tags.includes('archived')) {
                inquiry.tags.push('archived');
            }
            inquiry.status = 'archived';
            await inquiry.save();

            res.json({
                success: true,
                message: 'Inquiry archived successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Archive inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to archive inquiry',
                message: error.message
            });
        }
    }

    /**
     * API: Delete inquiry
     */
    async deleteInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            const manufacturerId = req.user.userId;

            this.logger.log(`🗑️ API: Deleting inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Check if inquiry can be deleted (only open or rejected inquiries)
            if (!['open', 'rejected', 'expired'].includes(inquiry.status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete inquiry with current status',
                    message: 'Only open, rejected or expired inquiries can be deleted'
                });
            }

            await Inquiry.findByIdAndDelete(inquiryId);

            res.json({
                success: true,
                message: 'Inquiry deleted successfully'
            });

        } catch (error) {
            this.logger.error('❌ Delete inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete inquiry',
                message: error.message
            });
        }
    }

    /**
     * API: Duplicate inquiry
     */
    async duplicateInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            const manufacturerId = req.user.userId;

            this.logger.log(`📋 API: Duplicating inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const originalInquiry = await Inquiry.findById(inquiryId);
            if (!originalInquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Original inquiry not found'
                });
            }

            // Check authorization
            if (originalInquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Create duplicate
            const duplicateData = {
                type: originalInquiry.type,
                inquirer: originalInquiry.inquirer,
                supplier: originalInquiry.supplier,
                product: originalInquiry.product,
                subject: `Copy of ${originalInquiry.subject}`,
                message: originalInquiry.message,
                requestedQuantity: originalInquiry.requestedQuantity,
                unit: originalInquiry.unit,
                customSpecifications: originalInquiry.customSpecifications,
                budgetRange: originalInquiry.budgetRange,
                timeline: originalInquiry.timeline,
                shipping: originalInquiry.shipping,
                status: 'open',
                priority: originalInquiry.priority,
                tags: ['duplicated']
            };

            const duplicate = new Inquiry(duplicateData);
            await duplicate.save();

            res.json({
                success: true,
                message: 'Inquiry duplicated successfully',
                inquiry: await this.formatInquiryResponse(duplicate)
            });

        } catch (error) {
            this.logger.error('❌ Duplicate inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to duplicate inquiry',
                message: error.message
            });
        }
    }

    /**
     * API: Set inquiry priority
     */
    async setInquiryPriority(req, res) {
        try {
            const { inquiryId } = req.params;
            const { priority } = req.body;
            const manufacturerId = req.user.userId;

            this.logger.log(`🚩 API: Setting priority for inquiry ${inquiryId} to ${priority} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Validate priority
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid priority value'
                });
            }

            inquiry.priority = priority;
            await inquiry.save();

            res.json({
                success: true,
                message: 'Priority updated successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Set priority API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to set priority',
                message: error.message
            });
        }
    }

    /**
     * API: Add note to inquiry
     */
    async addInquiryNote(req, res) {
        try {
            const { inquiryId } = req.params;
            const { note } = req.body;
            const manufacturerId = req.user.userId;

            this.logger.log(`📝 API: Adding note to inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId);
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Add note to internal notes
            const timestamp = new Date().toISOString();
            const existingNotes = inquiry.internalNotes || '';
            inquiry.internalNotes = existingNotes + `\n[${timestamp}] ${note}`;
            
            await inquiry.save();

            res.json({
                success: true,
                message: 'Note added successfully',
                inquiry: await this.formatInquiryResponse(inquiry)
            });

        } catch (error) {
            this.logger.error('❌ Add note API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add note',
                message: error.message
            });
        }
    }

    /**
     * API: Export inquiry data
     */
    async exportInquiry(req, res) {
        try {
            const { inquiryId } = req.params;
            const manufacturerId = req.user.userId;

            this.logger.log(`📤 API: Exporting inquiry ${inquiryId} by manufacturer: ${manufacturerId}`);

            const inquiry = await Inquiry.findById(inquiryId)
                .populate('inquirer', 'companyName name email phone country')
                .populate('product', 'title name category images')
                .lean();

            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found'
                });
            }

            // Check authorization
            if (inquiry.supplier.toString() !== manufacturerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to inquiry'
                });
            }

            // Format export data
            const exportData = {
                inquiryNumber: inquiry.inquiryNumber,
                type: inquiry.type,
                subject: inquiry.subject,
                message: inquiry.message,
                status: inquiry.status,
                priority: inquiry.priority,
                customer: {
                    company: inquiry.inquirer?.companyName || inquiry.inquirer?.name,
                    email: inquiry.inquirer?.email,
                    phone: inquiry.inquirer?.phone,
                    country: inquiry.inquirer?.country
                },
                product: {
                    name: inquiry.product?.title || inquiry.product?.name,
                    category: inquiry.product?.category
                },
                details: {
                    requestedQuantity: inquiry.requestedQuantity,
                    unit: inquiry.unit,
                    budgetRange: inquiry.budgetRange,
                    timeline: inquiry.timeline
                },
                dates: {
                    created: inquiry.createdAt,
                    updated: inquiry.updatedAt,
                    expires: inquiry.expiresAt
                },
                communication: {
                    messagesCount: inquiry.messages?.length || 0,
                    quotesCount: inquiry.quotes?.length || 0,
                    lastMessage: inquiry.messages?.length > 0 ? inquiry.messages[inquiry.messages.length - 1].timestamp : null
                }
            };

            res.json({
                success: true,
                exportData,
                exportedAt: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Export inquiry API error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export inquiry',
                message: error.message
            });
        }
    }
}

module.exports = InquiryController;
