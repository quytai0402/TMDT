#!/bin/bash

echo "🔧 Setting up MongoDB replica set for Prisma..."

# Stop MongoDB if running
echo "Stopping MongoDB..."
brew services stop mongodb-community

# Create data directory
mkdir -p ~/data/mongodb

# Start MongoDB with replica set
echo "Starting MongoDB with replica set..."
mongod --replSet rs0 --port 27017 --dbpath ~/data/mongodb --fork --logpath ~/data/mongodb/mongod.log

# Wait for MongoDB to start
sleep 3

# Initialize replica set
echo "Initializing replica set..."
mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"

sleep 2

# Check status
echo "Checking replica set status..."
mongosh --eval "rs.status()"

echo "✅ MongoDB replica set is ready!"
echo "You can now run: npm run db:seed"
