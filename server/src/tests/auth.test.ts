import assert from 'assert';
import jwt from 'jsonwebtoken';
import { User } from '../modules/auth/user.model';
import { Partner } from '../modules/partners/partner.model';
import { authService } from '../modules/auth/auth.service';
import { requireAuth, requirePartner } from '../middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';
import { env } from '../config/env';

/**
 * Automated Test Suite for Phase 2: Authentication & Equal Partner Authorization
 */
const runAuthTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Phase 2 Authentication & Authorization Test Suite');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      testsPassed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message || err}`);
      testsFailed++;
    }
  };

  // --- 1. Password Hashing & Bcrypt Verification ---
  await test('Password Hashing: generates valid bcrypt hash with salt', async () => {
    const plain = 'SecretPartnerPass123!';
    const hash = await User.hashPassword(plain);

    assert(hash.startsWith('$2'), 'Hash should start with standard bcrypt identifier $2');
    assert.notStrictEqual(hash, plain, 'Hash must not equal plain text');

    // Create user instance with mock method to test comparePassword
    const userInstance = new User({
      username: 'test_hash_user',
      passwordHash: hash,
    });

    const isMatch = await userInstance.comparePassword(plain);
    assert.strictEqual(isMatch, true, 'comparePassword should return true for correct password');

    const isWrongMatch = await userInstance.comparePassword('WrongPassword');
    assert.strictEqual(isWrongMatch, false, 'comparePassword should return false for incorrect password');
  });

  // --- 2. Token Generation & Verification ---
  await test('JWT Verification: successfully signs and verifies token payload', async () => {
    const payload = {
      userId: '659000000000000000000001',
      partnerId: '659000000000000000000002',
      username: 'partner1',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = authService.verifyToken(token);

    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.partnerId, payload.partnerId);
    assert.strictEqual(decoded.username, payload.username);
  });

  // --- 3. Invalid & Tampered Tokens ---
  await test('JWT Security: rejects tampered or malformed tokens', async () => {
    assert.throws(
      () => authService.verifyToken('invalid.jwt.token'),
      (err: any) => err instanceof UnauthorizedError,
      'Should throw UnauthorizedError for malformed token'
    );

    const forgedToken = jwt.sign({ userId: 'fake' }, 'wrong_secret_key');
    assert.throws(
      () => authService.verifyToken(forgedToken),
      (err: any) => err instanceof UnauthorizedError,
      'Should throw UnauthorizedError for forged signature'
    );
  });

  // --- 4. Authentication Middleware (requireAuth) ---
  await test('requireAuth: rejects requests with missing or invalid Authorization header', async () => {
    const reqMissingHeader: any = { headers: {} };
    let capturedError: any = null;

    await requireAuth(reqMissingHeader, {} as any, (err) => {
      capturedError = err;
    });

    assert(capturedError instanceof UnauthorizedError, 'Should reject missing Authorization header');

    const reqMalformedHeader: any = { headers: { authorization: 'Basic 12345' } };
    let malformedError: any = null;

    await requireAuth(reqMalformedHeader, {} as any, (err) => {
      malformedError = err;
    });

    assert(malformedError instanceof UnauthorizedError, 'Should reject non-Bearer scheme');
  });

  await test('requireAuth: attaches decoded user to Request on valid Bearer token', async () => {
    const payload = {
      userId: '659000000000000000000001',
      partnerId: '659000000000000000000002',
      username: 'partner2',
    };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };

    let nextCalled = false;
    await requireAuth(req, {} as any, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Next function should be called');
    assert.strictEqual(req.user?.userId, payload.userId, 'req.user.userId should match');
    assert.strictEqual(req.user?.partnerId, payload.partnerId, 'req.user.partnerId should match');
    assert.strictEqual(req.user?.username, payload.username, 'req.user.username should match');
  });

  // --- 5. Equal Partner Authorization Policy ---
  await test('Authorization Policy: enforces equal access policy across all three partners', async () => {
    // Phase 2 confirmed rule: There is NO Admin/Staff hierarchy.
    // All 3 partners must pass the identical authorization check.
    const partners = [
      { id: '1', name: 'Partner 1', username: 'partner1' },
      { id: '2', name: 'Partner 2', username: 'partner2' },
      { id: '3', name: 'Partner 3', username: 'partner3' },
    ];

    for (const p of partners) {
      const token = jwt.sign(
        { userId: p.id, partnerId: p.id, username: p.username },
        env.JWT_SECRET
      );
      const decoded = authService.verifyToken(token);
      assert.strictEqual(decoded.username, p.username);
      // All partners possess identical claims structure and authorization weight
      assert.strictEqual('role' in decoded, false, 'No hierarchical role field should exist on partner session');
    }
  });

  // --- 6. Account Status Checks ---
  await test('Account Status Validation: inactive partner or user triggers ForbiddenError', async () => {
    // Stub getCurrentPartner resolution with inactive status
    const originalGetCurrent = authService.getCurrentPartner;
    authService.getCurrentPartner = async () => ({
      user: { status: 'INACTIVE' } as any,
      partner: { status: 'ACTIVE' } as any,
    });

    const req: any = { user: { userId: '123' } };
    let statusError: any = null;

    await requirePartner(req, {} as any, (err) => {
      statusError = err;
    });

    assert(statusError instanceof ForbiddenError, 'Inactive user must be rejected with ForbiddenError');

    // Restore original method
    authService.getCurrentPartner = originalGetCurrent;
  });

  // --- 7. Idempotency & Protection against plain-text password leak ---
  await test('Security: User model toJSON never returns passwordHash or __v', async () => {
    const userDoc = new User({
      partner: new Partner()._id,
      username: 'safe_user',
      passwordHash: '$2a$10$e8O...',
      status: 'ACTIVE',
    });

    const json = userDoc.toJSON();
    assert.strictEqual(json.passwordHash, undefined, 'passwordHash must never be present in serialized JSON');
    assert.strictEqual(json.__v, undefined, '__v should be stripped in serialized JSON');
  });

  console.log('\n====================================================');
  console.log(`Test Execution Summary: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runAuthTests().catch((err) => {
  console.error('Test suite runner encountered critical error:', err);
  process.exit(1);
});
