// MongoDB initialization script
// This script runs when the container starts for the first time

// Switch to the slex-db database
db = db.getSiblingDB('slex-db');

// Create a user for the application
db.createUser({
  user: 'slexuser',
  pwd: 'slexpass123',
  roles: [
    {
      role: 'readWrite',
      db: 'slex-db'
    }
  ]
});

// Create initial collections (optional)
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('admins');

print('Database initialization completed');