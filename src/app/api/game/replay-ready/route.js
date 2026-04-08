import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'
import { cookies } from 'next/headers';

/**
 * POST /api/game/replay-ready
 * Body: { roomId }
 * 
 * Sets the player's `ready_for_replay = true`.
 * Then triggers the `reset_game_if_ready(roomId)` RPC.
 */
export async function POST(request) {
    try {
        const { roomId } = await request.json()
        if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })

        // 1. Session Authorization
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('mafia_session');

        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        let actorUserId = null;
        try {
            const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded);
            actorUserId = parsed.userId;
        } catch(e) {}
        
        if (!actorUserId) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
        const supabase = createServerClient()

        // Securely fetch exact Player ID for this session
        const { data: actorPlayer, error: actorError } = await supabase
            .from('players')
            .select('id, ready_for_replay')
            .eq('room_id', roomId)
            .eq('user_id', actorUserId)
            .single();

        if (actorError || !actorPlayer) return NextResponse.json({ error: 'Joueur introuvable.' }, { status: 404 });

        // Update ready_for_replay
        const { error: updateError } = await supabase
            .from('players')
            .update({ ready_for_replay: true })
            .eq('id', actorPlayer.id);

        if (updateError) throw updateError;

        // Try to trigger the game reset RPC
        const { data: isReset, error: resetError } = await supabase.rpc('reset_game_if_ready', {
            p_room_id: roomId
        });

        if (resetError) {
            console.error('RPC Error:', resetError);
        }

        return NextResponse.json({ success: true, gameReset: isReset === true })
    } catch (err) {
        console.error('[/api/game/replay-ready]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
