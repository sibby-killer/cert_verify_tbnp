# Bungoma National Polytechnic - Certificate Verification System

A highly secure, serverless certificate verification system developed for Bungoma National Polytechnic. Built with React (Vite), Node.js serverless functions, and LibSQL (Turso SQLite), ensuring maximum speed, minimal cost, and secure cryptographic verification of student graduation certificates.

## Architecture Highlights
- **Frontend**: React + Vite + TailwindCSS (Deployed on Vercel)
- **Backend**: Express-style routing mapped to Vercel Serverless Functions (`/api/*`)
- **Database**: Turso (Edge LibSQL) coupled with Drizzle ORM
- **Security**: JWT-based Authentication, strict Role-Based Access Control (RBAC), encoded QR Verification

## Role-Based Privileges
The system utilizes rigid token-based RBAC enforcement:
1. **Super Admin**: Has exclusive permissions to create, edit, and delete Students, Courses, and other administrative personnel.
2. **Admin / Data Entry**: Authorized strictly to view student profiles and issue/digitally sign outgoing certificates.
3. **Public Gateway**: End-users can access `/` to scan their QR code and view verification records. 

## Deployment Guide (Vercel)

This application is built for 0-configuration deployment to Vercel. 

### Setting Environment Variables in Vercel
Before deployment, configure the following keys inside your Vercel Project Settings > Environment Variables:

```
# Core Security
JWT_SECRET=your_super_strong_random_secret_string

# Turso DB Access
TURSO_DATABASE_URL=libsql://your-deployment.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### Build Commands
Vercel should automatically detect the project. If not, use the following:
- **Framework Preset**: Vite
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

## Local Development

If you wish to test modifications locally:

1. Clone the repository and install dependencies in both the root folder and `/client` folder.
2. Ensure you create a local `.env` file that mimics your production secrets.
3. Start the simulated serverless environment:
   ```bash
   npm run local
   ```
4. Start the frontend Vite server:
   ```bash
   cd client
   npm run dev
   ```

## Design Specifications
The portal uses the approved Bungoma National Polytechnic institutional branding: 
- `Green: #166534` 
- Logo components load directly from the `public/` directory (`icon-512.png`).