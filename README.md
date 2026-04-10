# Bungoma Poly Certificate Verification

## Setup

1. Clone repo
2. cp .env.example .env
3. Fill .env vars (create Turso DB, get URL/token)
4. npm install
5. npm run db:migrate
6. npm run db:seed
7. npm run dev

Default admin login: verify.bungomapoly.ac.ke/admin username: `admin` password: `BNP@Admin2024` - CHANGE IMMEDIATELY!

## Deployment

- Vercel: connect GitHub repo, add secrets TURSO_*, GMAIL_*, JWT_SECRET
- GitHub Actions auto deploys on main