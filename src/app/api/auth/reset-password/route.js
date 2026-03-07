import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Jeton manquant'),
    newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export async function POST(req) {
    try {
        const body = await req.json();
        const { token, newPassword } = resetPasswordSchema.parse(body);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Require service role key to bypass RLS for user lookup and update
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Find user by token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, reset_password_expires')
            .eq('reset_password_token', token)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
        }

        // 2. Check expiration
        const now = new Date();
        const expiresAt = new Date(user.reset_password_expires);
        if (now > expiresAt) {
            return NextResponse.json({ error: 'Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.' }, { status: 400 });
        }

        // 3. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update the user password and clear tokens
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hashed: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating user password:', updateError);
            throw new Error('Database error');
        }

        // 5. Update password in Supabase Auth (Native) to keep auth in sync (optional but recommended)
        // If the user attempts to login with Supabase later, they must have the same password.
        const { data: authUser, error: authUserError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (authUserError) {
            console.error('Warning: Error updating Auth user password:', authUserError);
            // We don't fail here since the custom users table was updated, but it's good to log
        }

        return NextResponse.json({
            message: 'Mot de passe réinitialisé avec succès.'
        }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
    }
}
