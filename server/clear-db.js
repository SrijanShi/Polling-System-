const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/polling-system');
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`Cleared collection: ${collection.collectionName}`);
    }
    
    console.log('✅ Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();
