export default function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: 'API is working!',
    env: {
      hasDbUrl: !!process.env.TURSO_DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
}
