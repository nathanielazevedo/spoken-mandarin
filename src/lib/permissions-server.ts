// Server-only permission helpers for API routes
import { NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import { isAdmin } from './permissions';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user, error: null };
}

export async function requireAdmin() {
  const { user, error } = await requireAuth();
  
  if (error) {
    return { user: null, error };
  }

  const userMetadata = user!.user_metadata;
  if (!isAdmin(userMetadata)) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  return { user, error: null };
}
