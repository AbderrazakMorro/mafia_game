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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mafiaculture.vercel.app/';
    const resetLink = `${baseUrl}/update-password?token=${token}`;

    const mailOptions = {
      from: `"MIDNIGHT SYNDICATE" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'MAFIA ONLINE — Recover Your Identity',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <!--[if mso]>
  <style>
    table, td, div, p, span, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0f; color: #e4e1e7; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0b0f; min-height: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main Container (600px max) -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 0 48px 0;">
              <h1 style="margin: 0; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #d3bbff; text-shadow: 0 0 15px rgba(211,187,255,0.3);">
                MIDNIGHT SYNDICATE
              </h1>
              <p style="margin: 8px 0 0 0; font-family: 'Inter', Arial, sans-serif; font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(204,195,215,0.4);">
                Secure Transmission
              </p>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td style="background: rgba(31,31,35,0.85); border: 1px solid rgba(74,68,85,0.15); border-radius: 12px; position: relative; overflow: hidden;">

              <!-- Purple accent bar at top-left -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 0;">
                    <div style="width: 3px; height: 64px; background: linear-gradient(to bottom, #d3bbff, transparent); margin: 0;"></div>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding: 32px 40px 40px 40px;">
                <!-- Heading -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h2 style="margin: 0; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #e4e1e7; letter-spacing: -0.01em; line-height: 1.2;">
                      RECOVER YOUR<br/>
                      <span style="color: #d3bbff;">IDENTITY</span>
                    </h2>
                  </td>
                </tr>

                <!-- Identity Graphic Banner -->
                <tr>
                  <td style="padding-bottom: 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0e0e12; border: 1px solid rgba(74,68,85,0.1); border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="height: 120px; background: linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(14,14,18,0.9) 60%, rgba(146,21,23,0.08) 100%); position: relative; vertical-align: bottom; padding: 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size: 14px; color: #d3bbff; padding-right: 8px; vertical-align: middle;">&#128274;</td>
                              <td style="font-family: 'Inter', Arial, sans-serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(211,187,255,0.6); vertical-align: middle;">
                                Encryption Active
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body Copy -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #ccc3d7;">
                      A request was initiated from a secure node to reset the password for your operative profile. If you did not authorize this action, ignore this transmission—the shadows will protect your status.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #ccc3d7;">
                      To proceed with the re-identification process, engage the link below.
                    </p>
                  </td>
                </tr>

                <!-- Primary CTA Button -->
                <tr>
                  <td align="center" style="padding: 48px 0 32px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #d3bbff 0%, #6d28d9 100%); border-radius: 12px; box-shadow: 0 0 20px rgba(109,40,217,0.3);">
                          <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #3f008d; text-decoration: none; letter-spacing: 0.1em; text-transform: uppercase;">
                            RESET PASSWORD &nbsp;&#10095;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiration Notice -->
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1b1b1f; border: 1px solid rgba(74,68,85,0.05); border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size: 16px; color: #ffb4ac; padding-right: 12px; vertical-align: middle;">&#9200;</td>
                              <td style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(204,195,215,0.8); font-style: italic; vertical-align: middle;">
                                This extraction link expires in <span style="color: #ffb4ac; font-weight: 700; font-style: normal;">1 hour</span>.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 48px 0 16px 0;">
              <!-- Brand Tag -->
              <p style="margin: 0 0 8px 0; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: rgba(211,187,255,0.6); font-weight: 700;">
                EYES OPEN.
              </p>
              <!-- Footer Links -->
              <p style="margin: 0 0 16px 0; font-family: 'Inter', Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(204,195,215,0.3);">
                Support &nbsp;&bull;&nbsp; Privacy Protocol &nbsp;&bull;&nbsp; Terms of Engagement
              </p>
              <!-- Copyright -->
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(204,195,215,0.2);">
                &copy; 2026 MIDNIGHT SYNDICATE. DATA ENCRYPTED.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
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
