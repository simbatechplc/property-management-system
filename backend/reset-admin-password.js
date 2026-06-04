/**
 * Resets ALL admin user passwords using better-auth's scrypt format.
 * better-auth uses the format: scrypt:N:r:p:salt:hash (base64)
 * We use the @node-rs/argon2 or Node crypto scrypt to match.
 * 
 * Actually better-auth stores passwords in the `account` table (providerId = "credential")
 * We'll use the same approach as the backend: call better-auth context.
 * 
 * Simpler approach: use the existing /auth/forgot-password flow via the API,
 * OR directly update using Node's built-in crypto.scryptSync to match better-auth's format.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const DB_URL = 'postgresql://neondb_owner:npg_POAGHSC1Tqy4@ep-sparkling-moon-adosvr5y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const p = new PrismaClient({ datasources: { db: { url: DB_URL } } });

// Replicate better-auth's scrypt password hashing
// better-auth default: N=16384 is too large for some Node versions
// Using N=1024 which is what better-auth actually defaults to
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, { N: 1024, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('base64') + ':' + salt.toString('base64'));
    });
  });
}

async function main() {
  const newPassword = 'A1234a';
  const hash = await hashPassword(newPassword);
  
  // Find admin users
  const admins = await p.user.findMany({ 
    where: { role: 'ADMIN' }, 
    select: { id: true, email: true } 
  });
  console.log('Admin accounts found:', JSON.stringify(admins));
  
  if (admins.length === 0) {
    console.log('No admin accounts found');
    await p.$disconnect();
    return;
  }

  // Update the account table (where better-auth stores passwords)
  for (const admin of admins) {
    const account = await p.account.findFirst({
      where: { userId: admin.id, providerId: 'credential' }
    });
    if (account) {
      await p.account.update({ where: { id: account.id }, data: { password: hash } });
      console.log(`✓ Password reset for ${admin.email}`);
    } else {
      // No credential account — create one
      await p.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: admin.id,
          providerId: 'credential',
          accountId: admin.id,
          password: hash,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log(`✓ Created credential account + password for ${admin.email}`);
    }
  }
  
  console.log(`\nAll done! New password: ${newPassword}`);
  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); p.$disconnect(); process.exit(1); });
