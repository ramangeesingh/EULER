import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import prisma from './db.js';

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// ── Boot-time env check ──────────────────────────────────────────────────────
console.log('[auth] VITE_SUPABASE_URL   =', VITE_SUPABASE_URL  ? '✅ set' : '❌ MISSING');
console.log('[auth] VITE_SUPABASE_ANON_KEY =', VITE_SUPABASE_ANON_KEY ? '✅ set' : '❌ MISSING');

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️  [auth] Supabase credentials missing — all auth calls WILL fail with 500');
}

const supabase = createClient(VITE_SUPABASE_URL || '', VITE_SUPABASE_ANON_KEY || '');

/**
 * Middleware to require a valid Supabase authentication token.
 * Also synchronizes the authenticated user to the local PostgreSQL database using Prisma.
 */
export async function requireAuth(req, res, next) {
  const requestId = Math.random().toString(36).slice(2, 8);

  try {
    // ── Step 1: Extract Authorization header ──────────────────────────────
    const authHeader = req.headers.authorization;
    console.log(`[auth:${requestId}] Step 1 — Authorization header: ${authHeader ? `"${authHeader.slice(0, 30)}..."` : 'MISSING'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[auth:${requestId}] ❌ Rejected — no Bearer token in header`);
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    // ── Step 2: Extract the token ─────────────────────────────────────────
    const token = authHeader.split(' ')[1];
    console.log(`[auth:${requestId}] Step 2 — Token extracted, length=${token?.length ?? 0}`);

    if (!token || token.length < 10) {
      console.warn(`[auth:${requestId}] ❌ Rejected — token too short or empty`);
      return res.status(401).json({ error: 'Unauthorized: Malformed token' });
    }

    // ── Step 3: Verify token with Supabase ────────────────────────────────
    console.log(`[auth:${requestId}] Step 3 — Calling supabase.auth.getUser(token)...`);
    const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);

    if (supabaseError) {
      console.error(`[auth:${requestId}] ❌ Step 3 FAILED — Supabase error:`, {
        message: supabaseError.message,
        status:  supabaseError.status,
        code:    supabaseError.code,
        name:    supabaseError.name,
      });
      return res.status(401).json({ error: 'Unauthorized: Invalid token', detail: supabaseError.message });
    }

    if (!user) {
      console.warn(`[auth:${requestId}] ❌ Step 3 FAILED — Supabase returned no user (token may be expired)`);
      return res.status(401).json({ error: 'Unauthorized: No user found for token' });
    }

    console.log(`[auth:${requestId}] ✅ Step 3 PASSED — Supabase user: id=${user.id}, email=${user.email}`);

    // ── Step 4: Look up user in Prisma by supabaseUserId ─────────────────
    console.log(`[auth:${requestId}] Step 4 — Looking up user in DB by supabaseUserId=${user.id}...`);
    let dbUser;

    try {
      dbUser = await prisma.user.findUnique({
        where: { supabaseUserId: user.id },
      });
      console.log(`[auth:${requestId}] Step 4a — findUnique(supabaseUserId): ${dbUser ? `found id=${dbUser.id}` : 'not found'}`);
    } catch (dbErr) {
      console.error(`[auth:${requestId}] ❌ Step 4a FAILED — Prisma query error:`, {
        message: dbErr.message,
        code:    dbErr.code,
        meta:    dbErr.meta,
        stack:   dbErr.stack,
      });
      throw dbErr; // rethrow to outer catch → 500
    }

    if (!dbUser) {
      // ── Step 5: Fall back to email lookup ──────────────────────────────
      console.log(`[auth:${requestId}] Step 5 — Falling back to email lookup: ${user.email}...`);
      try {
        dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        console.log(`[auth:${requestId}] Step 5a — findUnique(email): ${dbUser ? `found id=${dbUser.id}` : 'not found'}`);
      } catch (dbErr) {
        console.error(`[auth:${requestId}] ❌ Step 5a FAILED — Prisma email query error:`, {
          message: dbErr.message,
          code:    dbErr.code,
          meta:    dbErr.meta,
          stack:   dbErr.stack,
        });
        throw dbErr;
      }

      if (dbUser) {
        // ── Step 6: Link Supabase ID to existing Prisma record ───────────
        console.log(`[auth:${requestId}] Step 6 — Linking supabaseUserId to existing user id=${dbUser.id}...`);
        try {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data:  { supabaseUserId: user.id },
          });
          console.log(`[auth:${requestId}] ✅ Step 6 — Linked successfully`);
        } catch (dbErr) {
          console.error(`[auth:${requestId}] ❌ Step 6 FAILED — Prisma update error:`, {
            message: dbErr.message,
            code:    dbErr.code,
            meta:    dbErr.meta,
            stack:   dbErr.stack,
          });
          throw dbErr;
        }
      } else {
        // ── Step 7: Create new user ──────────────────────────────────────
        console.log(`[auth:${requestId}] Step 7 — Creating new DB user for email=${user.email}...`);
        try {
          dbUser = await prisma.user.create({
            data: {
              email:          user.email,
              name:           user.user_metadata?.name || user.email.split('@')[0],
              supabaseUserId: user.id,
              plan:           'FREE',
            },
          });
          console.log(`[auth:${requestId}] ✅ Step 7 — New user created, id=${dbUser.id}`);
        } catch (dbErr) {
          console.error(`[auth:${requestId}] ❌ Step 7 FAILED — Prisma create error:`, {
            message: dbErr.message,
            code:    dbErr.code,
            meta:    dbErr.meta,
            stack:   dbErr.stack,
          });
          throw dbErr;
        }
      }
    }

    // ── Step 8: Attach user and proceed ──────────────────────────────────
    req.user = dbUser;
    console.log(`[auth:${requestId}] ✅ Auth complete — req.user.id=${dbUser.id}`);
    next();

  } catch (err) {
    console.error(`[auth:${requestId}] ❌ UNCAUGHT error in requireAuth:`, {
      message: err.message,
      code:    err.code,
      meta:    err.meta,
      stack:   err.stack,
    });
    res.status(500).json({
      error:  'Authentication internal server error',
      detail: err.message,
      code:   err.code,
    });
  }
}

export default requireAuth;
