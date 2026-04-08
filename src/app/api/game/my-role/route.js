import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'
import { cookies } from 'next/headers';

/**
 * GET /api/game/my-role?roomId=...
 * Returns the current player's own row (including role) securely.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('roomId')

        if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('mafia_session');
        
        let userId = null;
        if (sessionCookie && sessionCookie.value) {
            try {
                const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
                const parsed = JSON.parse(decoded);
                userId = parsed.userId;
            } catch(e) {}
        }
        
        if (!userId) {
            userId = request.headers.get('x-user-id') // fallback for guests
        }
        
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createServerClient()
        const { data: player, error } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', userId)
            .single();

        if (error || !player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

        return NextResponse.json({ player })
    } catch (err) {
        console.error('[/api/game/my-role]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
