import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'

export async function POST(request) {
    try {
        const body = await request.json()
        const { roomId, userId, username, avatarUrl } = body

        if (!roomId || !userId || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createServerClient()

        // Verify room is public and exists
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single()

        if (roomError || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        // Check if player count would exceed max_players
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)

        if (count >= room.max_players) {
            return NextResponse.json({ error: 'La salle est pleine.' }, { status: 403 })
        }

        // Check if there's already a pending request
        const { data: existingReq } = await supabase
            .from('join_requests')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', userId)
            .eq('status', 'pending')
            .single()

        if (existingReq) {
            return NextResponse.json({ success: true, message: 'Request already pending' })
        }

        const { error } = await supabase
            .from('join_requests')
            .insert([{
                room_id: roomId,
                user_id: userId,
                username,
                avatar_url: avatarUrl,
                status: 'pending',
                created_at: new Date().toISOString()
            }])

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[/api/game/request-join]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
