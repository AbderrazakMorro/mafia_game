import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find the user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hashed);

        if (!isMatch) {
            return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
        }

        // Return user profile (exclude hash)
        const { password_hashed: _, ...userProfile } = user;

        return NextResponse.json({ user: userProfile }, { status: 200 });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
