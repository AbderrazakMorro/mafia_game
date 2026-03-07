import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const forgotPasswordSchema = z.object({
    email: z.string().email('Format email invalide'),
});

export async function POST(req) {
    try {
        const body = await req.json();
        const { email } = forgotPasswordSchema.parse(body);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Require service role key to bypass RLS for user lookup and update
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check if user exists in custom users table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email)
            .single();

        if (userError || !user) {
            // User not found. We still return success to prevent email enumeration.
            console.log(`Password reset requested for non-existent email: ${email}`);
            return NextResponse.json({
                message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.'
            }, { status: 200 });
        }

        // 2. Generate token and expiration
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour token validity

        // 3. Save token to users table
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_password_token: token,
                reset_password_expires: expiresAt.toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error saving reset token to DB:', updateError);
            throw new Error('Database error');
        }

        // 4. Send email using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/update-password?token=${token}`;

        const mailOptions = {
            from: `"Mafia Culture" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Réinitialisation de votre mot de passe - Mafia Culture',
            html: `
            <div style="background-color: #0a0a0a; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center; border-radius: 8px;">
              <div style="margin-bottom: 30px;">
                <h1 style="color: #e63946; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
                  Mafia Culture
                </h1>
                <div style="width: 50px; height: 2px; background-color: #e63946; margin: 10px auto;"></div>
              </div>

              <div style="max-width: 400px; margin: 0 auto;">
                <h2 style="font-weight: 300; font-size: 20px; margin-bottom: 20px;">La ville s'endort...</h2>
                <p style="color: #cccccc; line-height: 1.6; font-size: 15px;">
                  Une demande de réinitialisation de mot de passe a été détectée pour votre compte. Si c'est bien vous, cliquez sur le bouton ci-dessous pour revenir dans la partie.
                </p>

                <div style="margin: 40px 0;">
                  <a href="${resetLink}" style="background-color: #e63946; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(230, 57, 70, 0.3);">
                    Réinitialiser le Mot de Passe
                  </a>
                </div>

                <p style="color: #666666; font-size: 12px; margin-top: 30px;">
                  Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité. Le lien expirera dans 60 minutes.
                </p>
              </div>

              <div style="margin-top: 50px; border-top: 1px solid #222; padding-top: 20px;">
                <p style="font-size: 11px; color: #444;">&copy; 2026 Mafia Culture. Social Deduction Game.</p>
              </div>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);

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
