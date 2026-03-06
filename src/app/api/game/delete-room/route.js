import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabaseServer';

export async function POST(req) {
    try {
        const { roomId, hostId } = await req.json();

        if (!roomId || !hostId) {
            return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Verify room exists and host matches
        const { data: room, error: findError } = await supabase
            .from('rooms')
            .select('id, host_id')
            .eq('id', roomId)
            .single();

        if (findError || !room) {
            return NextResponse.json({ error: 'Salon introuvable.' }, { status: 404 });
        }

        if (room.host_id !== hostId) {
            return NextResponse.json({ error: 'Seul l\'hôte peut supprimer ce salon.' }, { status: 403 });
        }

        // Delete room (ON DELETE CASCADE handles players/actions/events/etc.)
        const { error: deleteError } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (deleteError) {
            console.error('Delete room error:', deleteError);
            return NextResponse.json({ error: 'Erreur lors de la suppression du salon.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Salon supprimé avec succès.' }, { status: 200 });

    } catch (error) {
        console.error('Delete Room Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
