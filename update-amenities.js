// Script to fix amenities field in MongoDB
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL || "mongodb+srv://quytai:quytai@tranquytai.ggro6.mongodb.net/homestay?retryWrites=true&w=majority";

async function fixAmenities() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('Listing');
    
    // Check current documents
    const count = await collection.countDocuments();
    console.log(`Found ${count} listings`);
    
    if (count > 0) {
      // Show sample document
      const sample = await collection.findOne({});
      console.log('Sample amenities field type:', typeof sample?.amenities);
      console.log('Sample amenities value:', sample?.amenities);
    }
    
  } finally {
    await client.close();
  }
}

fixAmenities().catch(console.error);
