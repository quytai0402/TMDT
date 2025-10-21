const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

async function testConnection() {
  const uri = process.env.DATABASE_URL;
  
  console.log('🔍 Testing MongoDB connection...');
  console.log('📝 Connection URI:', uri?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('⏳ Connecting...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test database access
    const db = client.db('homestay');
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test a simple query
    const usersCount = await db.collection('User').countDocuments();
    console.log('👥 Users count:', usersCount);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('Server selection timeout')) {
      console.log('\n📋 Possible causes:');
      console.log('1. IP address not whitelisted in MongoDB Atlas');
      console.log('2. Network/firewall blocking connection');
      console.log('3. Incorrect connection string');
      console.log('4. MongoDB Atlas cluster is paused or unavailable');
      console.log('\n💡 Solutions:');
      console.log('1. Go to MongoDB Atlas > Network Access > Add your current IP');
      console.log('2. Or add 0.0.0.0/0 to allow all IPs (not recommended for production)');
      console.log('3. Check if your cluster is running in MongoDB Atlas');
    }
    
    return false;
  } finally {
    await client.close();
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
