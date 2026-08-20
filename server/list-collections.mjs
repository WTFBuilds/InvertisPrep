// One-time inspection: list collections and counts (read-only)
import 'dotenv/config';
import mongoose from 'mongoose';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name} = ${count}`);
  }
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e.message); process.exit(1); });
