import { db } from '../lib/db/index.js';
import { securityReports } from '../lib/db/schema.js';
import { success, error } from '../lib/utils/responseHelper.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json(error('Method not allowed'));

  try {
    const { securityNumber, details } = req.body;
    
    if (!securityNumber || !details) {
      return res.status(400).json(error('Security number and details are required'));
    }

    await db.insert(securityReports).values({
      id: crypto.randomUUID(),
      securityNumber,
      details,
      status: 'pending',
      reportedAt: new Date()
    });

    return res.status(201).json(success(null, 'Report submitted successfully'));
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
