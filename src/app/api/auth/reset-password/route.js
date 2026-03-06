import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token manquant'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export async function POST(req) {
    try {
        const body = await req.json();
        const { token, password } = resetPasswordSchema.parse(body);

        // Hash token to compare with database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find user by valid hashed token
        const { data: user, error } = await supabase
            .from('users')
            .select('id, reset_password_expires')
            .eq('reset_password_token', hashedToken)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 400 });
        }

        // Check if token has expired
        const now = new Date();
        const expiresAt = new Date(user.reset_password_expires);
        if (now > expiresAt) {
            return NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 400 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear token and expiration
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hashed: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Reset Password Update Error:', updateError);
            return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès.' }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
