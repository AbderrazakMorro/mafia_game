import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

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

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, pseudo')
            .eq('email', email)
            .single();

        // Security: Don't reveal if user exists or not to prevent email enumeration
        if (error || !user) {
            return NextResponse.json({ message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.' }, { status: 200 });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

        // Save hashed token and expiration to database
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_password_token: passwordResetToken,
                reset_password_expires: passwordResetExpires,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update token error:', updateError);
            return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
        }

        const appUrl = process.env.APP_URL || 'https://mafiaculture.vercel.app';
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

        // Send email via Resend
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: user.email,
            subject: 'Réinitialisation de votre mot de passe - Mafia Culture',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Demande de réinitialisation de mot de passe</h2>
                    <p>Bonjour ${user.pseudo},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour Mafia Culture.</p>
                    <p>Cliquer sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Réinitialiser le mot de passe
                        </a>
                    </div>
                    <p>Ce lien expirera dans 15 minutes.</p>
                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.' }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
