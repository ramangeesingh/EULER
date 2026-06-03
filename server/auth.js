import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import prisma from './db.js';

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials missing in backend environment');
}

const supabase = createClient(VITE_SUPABASE_URL || '', VITE_SUPABASE_ANON_KEY || '');

/**
 * Middleware to require a valid Supabase authentication token.
 * Also synchronizes the authenticated user to the local PostgreSQL database using Prisma.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Dynamic user syncing (Supabase Auth UID -> Prisma User record)
    let dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
    });

    if (!dbUser) {
      // Check if user exists with the same email
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (dbUser) {
        // Link the existing Prisma User to the Supabase ID
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUserId: user.id },
        });
      } else {
        // Create new user in the Prisma database
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            supabaseUserId: user.id,
            plan: 'FREE',
          },
        });
      }
    }

    // Attach local database user object to request
    req.user = dbUser;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ error: 'Authentication internal server error' });
  }
}
export default requireAuth;
