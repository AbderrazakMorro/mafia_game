import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
    try {
        const { userId, email } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify user exists and email matches
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .eq('email', email)
            .single();

        if (findError || !user) {
            return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
        }

        // Delete user (ON DELETE CASCADE handles related data)
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) {
            console.error('Delete account error:', deleteError);
            return NextResponse.json({ error: 'Erreur lors de la suppression du compte.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Compte supprimé avec succès.' }, { status: 200 });

    } catch (error) {
        console.error('Delete Account Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
