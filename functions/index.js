import admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import firebaseFunctions from 'firebase-functions';

const { logger } = firebaseFunctions;

admin.initializeApp();

export const scheduledClearMessages = onSchedule({
  schedule: '0 0 * * *',
  timeZone: 'America/Los_Angeles',
}, async () => {
  try {
    const db = admin.firestore();
    const messagesRef = db.collection('messages');
    const snapshot = await messagesRef.get();

    if (snapshot.empty) {
      logger.log('No messages found.');
      return;
    }

    const batchSize = 500;
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    snapshot.docs.forEach((doc) => {
      // Update the document to clear the 'texts' array
      currentBatch.update(doc.ref, { 
        texts: [],
        // Optional: Add a lastCleared timestamp
        lastCleared: admin.firestore.FieldValue.serverTimestamp() 
      });
      operationCount++;

      if (operationCount % batchSize === 0) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
      }
    });

    if (operationCount % batchSize !== 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    logger.log(`Cleared texts in ${operationCount} messages successfully.`);
  } catch (error) {
    logger.error('Error clearing messages:', error);
    throw error;
  }
});

export const scheduledClearStorage = onSchedule({
    schedule: '0 0 * * *', 
    timeZone: 'America/Los_Angeles',
  }, async () => {
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: 'chatImages/' });
  
      if (files.length === 0) {
        logger.log('No images found in chatImages folder.');
        return;
      }
  
      // Delete files in batches of 100
      const batchSize = 100;
      let deletedCount = 0;
  
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(file => file.delete()));
        deletedCount += batch.length;
        logger.log(`Deleted ${batch.length} images (total: ${deletedCount})`);
      }
  
      logger.log(`Successfully deleted ${deletedCount} images total.`);
    } catch (error) {
      logger.error('Error deleting images:', error);
      throw error;
    }
  });