const admin = require('firebase-admin');

// Use emulator settings
admin.initializeApp({
  projectId: 'lokey-service',
  credential: admin.credential.applicationDefault(),
  databaseURL: 'http://localhost:9000?ns=lokey-service-default-rtdb'
});

const db = admin.firestore();
db.settings({
  host: 'localhost:8080',
  ssl: false
});

async function cleanDatabase() {
  console.log('Cleaning database...');

  try {
    // Delete all partners
    const partnersSnapshot = await db.collection('partners').get();
    console.log(`Found ${partnersSnapshot.size} partners to delete`);

    for (const doc of partnersSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete all deals
    const dealsSnapshot = await db.collection('deals').get();
    console.log(`Found ${dealsSnapshot.size} deals to delete`);

    for (const doc of dealsSnapshot.docs) {
      await doc.ref.delete();
    }

    console.log('Database cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();