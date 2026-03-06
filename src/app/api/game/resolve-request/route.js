import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'

export async function POST(request) {
    try {
        const body = await request.json()
        const { requestId, action, hostId } = body  // action: 'accepted' | 'rejected'

        if (!requestId || !action || !hostId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        if (!['accepted', 'rejected'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const supabase = createServerClient()

        // Verify request exists and host owns the room
        const { data: joinReq, error: reqError } = await supabase
            .from('join_requests')
            .select('*, rooms!inner(host_id, max_players)')
            .eq('id', requestId)
            .single()

        if (reqError || !joinReq) {
            return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
        }

        if (joinReq.rooms.host_id !== hostId) {
            return NextResponse.json({ error: 'Unauthorized: Only the host can resolve requests' }, { status: 403 })
        }

        // If accepted, check capacity and insert player
        if (action === 'accepted') {
            const { count } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', joinReq.room_id)

            if (count >= joinReq.rooms.max_players) {
                return NextResponse.json({ error: 'Room is full' }, { status: 403 })
            }

            const { error: insertError } = await supabase
                .from('players')
                .insert([{
                    room_id: joinReq.room_id,
                    user_id: joinReq.user_id,
                    username: joinReq.username,
                    avatar_url: joinReq.avatar_url,
                    is_alive: true,
                    is_protected: false,
                    role: 'villager',
                    is_ready: false
                }])

            if (insertError) throw insertError
        }

        // Update the join request status
        const { error: updateError } = await supabase
            .from('join_requests')
            .update({ status: action })
            .eq('id', requestId)

        if (updateError) throw updateError

        return NextResponse.json({ success: true, action })
    } catch (err) {
        console.error('[/api/game/resolve-request]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
