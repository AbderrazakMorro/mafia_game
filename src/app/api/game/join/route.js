import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'

export async function POST(request) {
    try {
        const body = await request.json()
        const { roomId, userId, username, avatarUrl, isHost } = body

        if (!roomId || !userId || !username) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const supabase = createServerClient()

        // 1. Check if user already in room
        const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', userId)
            .single()

        if (existingPlayer) {
            return NextResponse.json({ player: existingPlayer })
        }

        // 2. Insert new player
        const { data: newPlayer, error: insertError } = await supabase
            .from('players')
            .insert([{
                room_id: roomId,
                user_id: userId,
                username,
                avatar_url: avatarUrl || null,
                is_alive: true,
                is_protected: false,
                role: 'villager',
                is_ready: false,
                ready_for_replay: false
            }])
            .select()
            .single()

        if (insertError) {
            console.error('Supabase Insert Error:', insertError)
            throw new Error(insertError.message || 'Unknown database error')
        }

        // 3. If they are the first and host_id is null, update room
        if (isHost) {
            await supabase.from('rooms').update({ host_id: userId }).eq('id', roomId).is('host_id', null)
        }

        return NextResponse.json({ player: newPlayer })
    } catch (err) {
        console.error('[/api/game/join]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
