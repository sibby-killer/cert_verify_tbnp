import { db } from '../lib/db/index.js';
import { adminUsers } from '../lib/db/schema.js';

export default async function handler(req, res) {
  try {
    const result = await db.select().from(adminUsers).limit(1);
    res.status(200).json({ 
      success: true, 
      message: 'API is working and DB is connected!',
      users: result.length
    });
  } catch (err) {
    res.status(200).json({ 
      success: false, 
      error_message: err.message,
      error_stack: err.stack
    });
  }
}

