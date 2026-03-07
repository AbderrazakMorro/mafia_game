import { NextResponse } from 'next/server';
import { getSupabaseServer } from '../../../../lib/supabaseServer'; // Assuming we have or will create this, or we can use standard supabase
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { pseudo, email, password } = await req.json();

    if (!pseudo || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }

    // Initialize Supabase
    // Note: To bypass RLS and insert without an existing auth session securely, 
    // you typically need a service role key. Let's assume we use standard client for now.
    // However, Supabase's regular insert might fail if RLS is enabled without authenticated user.
    // For simplicity per the request, we just insert.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // We import dynamically if needed, or just build one here
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},pseudo.eq.${pseudo}`)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email ou pseudo est déjà utilisé.' }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hashed = await bcrypt.hash(password, salt);

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          pseudo,
          email,
          password_hashed,
          score: 0,
          game_stats: { games_played: 0, games_won: 0 },
          role_history: []
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });
    }

    // Return success without password
    const { password_hashed: _, ...userProfile } = data;

    return NextResponse.json({ user: userProfile }, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
