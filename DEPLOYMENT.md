# SLEX Platform - Production Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- Docker & Docker Compose installed
- Git repository cloned
- Domain name configured
- SSL certificates ready

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit with your production values
nano .env
```

### 2. Deploy with Docker
```bash
# Build and start all services
npm run prod:deploy

# Or manually:
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl https://yourdomain.com/health
```

## 🔧 Production Configuration

### Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/slex-db?authSource=admin
REDIS_URL=redis://:redis123@redis:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
BCRYPT_ROUNDS=12

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Domain
DOMAIN=https://yourdomain.com
NODE_ENV=production
```

### SSL Certificate Setup
1. Place your SSL certificates in `./ssl/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Update `nginx.conf` with your domain name

## 📊 Monitoring & Maintenance

### Health Checks
- Application: `https://yourdomain.com/health`
- Database: MongoDB health check included
- Redis: Redis health check included

### Logs
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# All services
docker-compose -f docker-compose.prod.yml logs -f

# Database logs
docker-compose -f docker-compose.prod.yml logs -f mongodb
```

### Backup
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --out /backup

# File uploads backup
docker cp slex-app-prod:/app/public/uploads ./backups/uploads
```

### Updates
```bash
# Update application
git pull
npm run prod:update

# Or manually:
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Update dependencies

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3005
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose -f docker-compose.prod.yml logs mongodb
   ```

3. **SSL certificate issues**
   ```bash
   # Verify certificate
   openssl x509 -in ssl/cert.pem -text -noout
   ```

### Performance Optimization

1. **Enable Redis caching**
2. **Configure CDN for static assets**
3. **Set up database indexes**
4. **Monitor memory usage**

## 📞 Support

For production issues:
- Check logs first
- Verify environment variables
- Test health endpoints
- Contact system administrator
