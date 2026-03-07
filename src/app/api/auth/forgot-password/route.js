import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const forgotPasswordSchema = z.object({
    email: z.string().email('Format email invalide'),
});

export async function POST(req) {
    try {
        const body = await req.json();
        const { email } = forgotPasswordSchema.parse(body);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Use Supabase Auth's built-in PKCE password reset flow
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://mafiaculture.vercel.app/update-password',
        });

        if (error) {
            console.error('Supabase resetPasswordForEmail error:', error);
            // Don't reveal specifics to the client for security
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({
            message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.'
        }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
