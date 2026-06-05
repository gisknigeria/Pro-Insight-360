const dotenv = require('dotenv');
const path = require('path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '.env') });
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const id = crypto.randomUUID();
const email = 'test@pro-insight.local';
const setupToken = crypto.randomBytes(32).toString('hex');
const passwordHash = '$2b$12$KIX7C3e5qyE5fTzjh5E9s.O7gP2QkU4hPWlEXz3BiI1k9dZlw9oeW';

(async () => {
  try {
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role, mfa_enabled, failed_login_count, locked_until, setup_token, setup_token_expires_at, is_active)
      VALUES ($1, $2, $3, 'SUPER_ADMIN', false, 0, NULL, $4, now() + interval '48 hours', true)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        mfa_enabled = EXCLUDED.mfa_enabled,
        failed_login_count = EXCLUDED.failed_login_count,
        locked_until = EXCLUDED.locked_until,
        setup_token = EXCLUDED.setup_token,
        setup_token_expires_at = EXCLUDED.setup_token_expires_at,
        is_active = EXCLUDED.is_active;
    `, [id, email, passwordHash, setupToken]);

    const result = await pool.query(
      'SELECT email, role, setup_token, setup_token_expires_at, is_active FROM users WHERE email = $1',
      [email],
    );

    if (result.rowCount > 0) {
      const user = result.rows[0];
      console.log('? Test user is ready.');
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Setup Token: ${user.setup_token}`);
      console.log(`Setup Token Expires: ${user.setup_token_expires_at}`);
      console.log('Next steps:');
      console.log('1. Open https://pro-insight-360-web.vercel.app/auth/setup');
      console.log('2. Paste the setup token above');
      console.log('3. Create your password');
      console.log(`4. Login with: Email: ${email}`);
    } else {
      console.error('Failed to verify the created user.');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
