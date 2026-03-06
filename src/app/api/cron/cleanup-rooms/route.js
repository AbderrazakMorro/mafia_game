import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabaseServer';

export async function POST(req) {
    try {
        const supabase = createServerClient();

        // Calculate exactly 30 minutes ago in ISO format string
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        // Fetch rooms that are still in 'lobby' state and older than 30 minutes
        const { data: roomsToDelete, error: fetchError } = await supabase
            .from('rooms')
            .select('id')
            .eq('status', 'lobby')
            .lte('created_at', thirtyMinutesAgo);

        if (fetchError) {
            console.error("Error fetching old rooms:", fetchError);
            throw fetchError;
        }

        if (!roomsToDelete || roomsToDelete.length === 0) {
            return NextResponse.json({ success: true, message: "No inactive rooms to clean up." });
        }

        const roomIds = roomsToDelete.map(r => r.id);

        // Delete the identified rooms
        // Note: Assuming Supabase foreign keys are set to ON DELETE CASCADE for players, game_events, join_requests, etc.
        const { error: deleteError } = await supabase
            .from('rooms')
            .delete()
            .in('id', roomIds);

        if (deleteError) {
            console.error("Error deleting old rooms:", deleteError);
            throw deleteError;
        }

        console.log(`[CRON] Successfully cleaned up ${roomIds.length} inactive rooms.`);
        return NextResponse.json({ success: true, deletedCount: roomIds.length, deletedRooms: roomIds });

    } catch (error) {
        console.error("Cleanup API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
