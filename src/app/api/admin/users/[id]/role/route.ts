import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions-server';

// PATCH /api/admin/users/[id]/role - Update user role
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id: userId } = await context.params;

    // Prevent admin from removing their own admin status
    if (userId === user!.id) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be "admin" or "user"' }, { status: 400 });
    }

    // Use service role client to update user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
      },
    });
  } catch (error) {
    console.error('Error in update user role API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
