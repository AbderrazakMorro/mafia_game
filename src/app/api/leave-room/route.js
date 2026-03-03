import { NextResponse } from 'next/server'
import { createServerClient } from '../../../lib/supabaseServer'
import { checkWinCondition } from '../../../utils/gameLogic'

/**
 * POST /api/leave-room
 * Body: { roomId, playerId }
 *
 * Handles a player explicitly leaving a room.
 * - If game is in 'lobby', deletes the player entirely.
 * - Otherwise, sets is_alive = false.
 * - Checks win condition and updates room if necessary.
 * - Broadcasts 'player_left' event.
 */
export async function POST(request) {
    try {
        const { roomId, playerId } = await request.json()
        if (!roomId || !playerId) {
            return NextResponse.json({ error: 'roomId and playerId required' }, { status: 400 })
        }

        const supabase = createServerClient()

        // --- Fetch room ---
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single()

        if (roomError) throw roomError

        // --- Fetch leaving player ---
        const { data: leavingPlayer, error: pError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single()

        if (pError || !leavingPlayer) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 })
        }

        if (room.status === 'lobby') {
            // Simply delete the player if the game hasn't started yet
            const { error: deleteError } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId)

            if (deleteError) throw deleteError

            // Broadcast left event
            await supabase.from('game_events').insert([{
                room_id: roomId,
                phase_number: room.phase_number || 0,
                event_type: 'player_left',
                payload: {
                    playerId,
                    username: leavingPlayer.username,
                    inLobby: true
                }
            }])

            return NextResponse.json({ success: true, action: 'deleted' })
        } else {
            // Game is active, mark player as dead
            const { error: updateError } = await supabase
                .from('players')
                .update({ is_alive: false })
                .eq('id', playerId)

            if (updateError) throw updateError

            // Re-fetch all players to check win conditions
            const { data: players, error: allPlayersError } = await supabase
                .from('players')
                .select('*')
                .eq('room_id', roomId)

            if (allPlayersError) throw allPlayersError

            // Check if game is over
            const gameWinner = checkWinCondition(players)

            if (gameWinner) {
                await supabase
                    .from('rooms')
                    .update({ status: 'game_over', winner: gameWinner })
                    .eq('id', roomId)

                await supabase.from('game_events').insert([{
                    room_id: roomId,
                    phase_number: room.phase_number,
                    event_type: 'game_over',
                    payload: { winner: gameWinner },
                }])
            } else {
                // Broadcast player left / died
                await supabase.from('game_events').insert([{
                    room_id: roomId,
                    phase_number: room.phase_number,
                    event_type: 'player_left',
                    payload: {
                        playerId,
                        username: leavingPlayer.username,
                        role: leavingPlayer.role,
                        inLobby: false
                    }
                }])
            }

            return NextResponse.json({ success: true, action: 'marked_dead', gameWinner })
        }
    } catch (err) {
        console.error('[/api/leave-room]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
