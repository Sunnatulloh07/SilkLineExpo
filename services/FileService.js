/**
 * File Service
 * Handles file upload, processing, and management
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../public/uploads');
    this.logoDir = path.join(this.uploadDir, 'logos');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  }

  /**
   * Initialize upload directories
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.logoDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
      throw error;
    }
  }

  /**
   * Process company logo upload with enhanced error handling
   */
  async processCompanyLogo(file) {
    try {
      // Validate file
      this.validateFile(file);

      // Ensure upload directory exists
      await this.initializeDirectories();

      // Generate unique filename
      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const finalPath = path.join(this.logoDir, uniqueFilename);

      // Read file content and write directly to final location
      // This avoids cross-device link issues in Docker
      const fileContent = await fs.readFile(file.path);
      await fs.writeFile(finalPath, fileContent);
      
      // Clean up temporary file
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.warn('⚠️ Could not delete temp file:', file.path);
      }

      // Verify file was written successfully
      try {
        await fs.access(finalPath);
      } catch (accessError) {
        throw new Error('File upload failed - file not accessible after write');
      }

      // Generate thumbnail (optional)
      const thumbnailPath = await this.generateThumbnail(finalPath);

      const logoData = {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
        url: `/uploads/logos/${uniqueFilename}`, // User model uchun required field
        path: `/uploads/logos/${uniqueFilename}`, // Legacy support
        thumbnailUrl: thumbnailPath ? `/uploads/logos/thumbnails/${path.basename(thumbnailPath)}` : null,
        thumbnailPath: thumbnailPath ? `/uploads/logos/thumbnails/${path.basename(thumbnailPath)}` : null // Legacy support
      };

      return logoData;

    } catch (error) {
      console.error('❌ Logo processing error:', error);
      
      // Clean up file on error
      if (file && file.path) {
        await this.deleteFile(file.path).catch(console.error);
      }
      
      // Enhanced error message
      const enhancedError = new Error(`Logo processing failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.fileInfo = {
        originalName: file?.originalname,
        size: file?.size,
        mimetype: file?.mimetype
      };
      
      throw enhancedError;
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`File extension ${fileExtension} is not allowed`);
    }
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `company-logo-${timestamp}-${randomString}${extension}`;
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(imagePath) {
    try {
      // This would require image processing library like sharp
      // For now, we'll skip thumbnail generation
      // const sharp = require('sharp');
      // const thumbnailDir = path.join(this.logoDir, 'thumbnails');
      // await fs.mkdir(thumbnailDir, { recursive: true });
      // const thumbnailPath = path.join(thumbnailDir, `thumb_${path.basename(imagePath)}`);
      // await sharp(imagePath).resize(150, 150).jpeg({ quality: 80 }).toFile(thumbnailPath);
      // return thumbnailPath;
      
      return null; // Skip thumbnail for now
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null; // Don't fail upload if thumbnail fails
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * Delete company logo and its thumbnail
   */
  async deleteCompanyLogo(logoData) {
    try {
      if (!logoData || !logoData.filename) {
        return true;
      }

      const logoPath = path.join(this.logoDir, logoData.filename);
      await this.deleteFile(logoPath);

      // Delete thumbnail if exists
      if (logoData.thumbnailPath) {
        const thumbnailPath = path.join(this.logoDir, 'thumbnails', path.basename(logoData.thumbnailPath));
        await this.deleteFile(thumbnailPath);
      }

      return true;
    } catch (error) {
      console.error('Company logo deletion error:', error);
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old files (run as cron job)
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = await fs.readdir(this.logoDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.logoDir, file);
        const stats = await fs.stat(filePath);

        if (stats.birthtime < cutoffDate) {
          // Check if file is still referenced in database
          const isReferenced = await this.isFileReferenced(file);
          
          if (!isReferenced) {
            await this.deleteFile(filePath);
            deletedCount++;
          }
        }
      }

      return {
        deletedCount,
        message: `Cleaned up ${deletedCount} old files`
      };

    } catch (error) {
      console.error('File cleanup error:', error);
      throw error;
    }
  }

  /**
   * Check if file is still referenced in database
   */
  async isFileReferenced(filename) {
    try {
      const User = require('../models/User');
      const user = await User.findOne({ 'companyLogo.filename': filename });
      return !!user;
    } catch (error) {
      console.error('File reference check error:', error);
      return true; // Assume referenced to be safe
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats() {
    try {
      const files = await fs.readdir(this.logoDir);
      let totalSize = 0;
      let fileCount = files.length;

      for (const file of files) {
        const filePath = path.join(this.logoDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        averageFileSize: fileCount > 0 ? (totalSize / fileCount) : 0
      };

    } catch (error) {
      console.error('Upload stats error:', error);
      throw error;
    }
  }

  /**
   * Validate image dimensions (optional)
   */
  async validateImageDimensions(filePath, minWidth = 100, minHeight = 100, maxWidth = 2000, maxHeight = 2000) {
    try {
      // This would require image processing library like sharp
      // const sharp = require('sharp');
      // const metadata = await sharp(filePath).metadata();
      // 
      // if (metadata.width < minWidth || metadata.height < minHeight) {
      //   throw new Error(`Image dimensions too small. Minimum: ${minWidth}x${minHeight}`);
      // }
      // 
      // if (metadata.width > maxWidth || metadata.height > maxHeight) {
      //   throw new Error(`Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}`);
      // }
      // 
      // return {
      //   width: metadata.width,
      //   height: metadata.height,
      //   format: metadata.format
      // };

      return { valid: true }; // Skip validation for now
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FileService();