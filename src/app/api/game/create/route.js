import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabaseServer'

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { name, isPublic = false, maxPlayers = 8, hostId } = body

        if (!hostId) {
            return NextResponse.json({ error: 'hostId required' }, { status: 400 })
        }

        const supabase = createServerClient()
        const newCode = generateRoomCode()

        const { data, error } = await supabase
            .from('rooms')
            .insert([{
                code: newCode,
                name: name || `Partie de ${newCode}`,
                is_public: isPublic,
                max_players: maxPlayers,
                status: 'lobby',
                host_id: hostId,
                phase_number: 0
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ room: data })
    } catch (err) {
        console.error('[/api/game/create]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
