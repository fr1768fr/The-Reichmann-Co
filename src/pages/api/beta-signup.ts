// Lumarix Early Access Signup endpoint.
// Receives email, sends a welcome email to the signup plus a notification
// to the admin via Resend.
import type { APIRoute } from 'astro';

export const prerender = false;

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildWelcomeHtml = (signupDate: string) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0f1c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1c;padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#0f172a;border:1px solid rgba(148,163,184,0.12);border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="padding:40px 40px 32px;">
                            <div style="display:inline-block;padding:6px 12px;background:rgba(59, 130, 246,0.12);border:1px solid rgba(96, 165, 250,0.4);border-radius:100px;font-size:11px;font-weight:500;color:#60a5fa;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:24px;">
                                Early Access Confirmed
                            </div>
                            <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:-0.025em;line-height:1.2;color:#f8fafc;">
                                Welcome to <span style="background:linear-gradient(135deg,#60a5fa,#3b82f6);-webkit-background-clip:text;background-clip:text;color:transparent;">Lumarix</span> Early Access
                            </h1>
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                Thanks for signing up. You've secured a spot on our early access list for Lumarix, the next-generation Enterprise Resource Planning platform in active development at The Reichmann Co.
                            </p>
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                <strong style="color:#f8fafc;">What happens next?</strong><br>
                                When Lumarix is ready for early access, we'll email you directly with installer download, license details, and onboarding instructions. No further action needed on your side for now.
                            </p>
                            <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                If you have any questions in the meantime, just reply to this email.
                            </p>
                            <div style="padding-top:24px;border-top:1px solid rgba(148,163,184,0.12);">
                                <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;font-weight:500;">The Reichmann Co. (Pty) Ltd</p>
                                <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Reg. No. 2026/389746/07</p>
                                <p style="margin:0;font-size:13px;color:#64748b;">
                                    <a href="https://thereichmannco.co.za" style="color:#60a5fa;text-decoration:none;">thereichmannco.co.za</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;color:#475569;">
                    You're receiving this email because you signed up for Lumarix early access at thereichmannco.co.za. Signed up on ${escapeHtml(signupDate)}.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

const buildNotifyHtml = (email: string, signupDate: string) => {
  const safeEmail = escapeHtml(email);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center">
                <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
                    <tr>
                        <td>
                            <h2 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#0f172a;letter-spacing:-0.015em;">
                                New Lumarix Early Access Signup
                            </h2>
                            <p style="margin:0 0 20px;font-size:13px;color:#64748b;font-family:'JetBrains Mono',Menlo,Monaco,monospace;">
                                ${escapeHtml(signupDate)}
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
                                <tr>
                                    <td>
                                        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;font-family:'JetBrains Mono',Menlo,Monaco,monospace;">
                                            Email
                                        </p>
                                        <p style="margin:0;font-size:16px;color:#0f172a;font-weight:500;">
                                            <a href="mailto:${safeEmail}" style="color:#1d4ed8;text-decoration:none;">${safeEmail}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0;font-size:13px;color:#94a3b8;">
                                Signed up via the Lumarix early access form on thereichmannco.co.za.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return json({ error: 'A valid email address is required.' }, 400);
  }

  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const NOTIFICATION_EMAIL =
    import.meta.env.NOTIFICATION_EMAIL ?? process.env.NOTIFICATION_EMAIL ?? 'info@thereichmannco.co.za';
  const FROM_ADDRESS =
    import.meta.env.RESEND_FROM ?? process.env.RESEND_FROM ?? 'Lumarix Early Access <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set');
    return json({ error: 'Email service is not configured.' }, 500);
  }

  const signupDate = new Date().toISOString();
  const welcomeHtml = buildWelcomeHtml(signupDate);
  const notifyHtml = buildNotifyHtml(email, signupDate);

  try {
    const welcomeResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: email,
        reply_to: NOTIFICATION_EMAIL,
        subject: 'Welcome to Lumarix Early Access',
        html: welcomeHtml,
      }),
    });

    if (!welcomeResp.ok) {
      const errBody = await welcomeResp.text();
      console.error('Welcome email failed:', welcomeResp.status, errBody);
      return json({ error: 'Could not send welcome email. Please try again later.' }, 502);
    }

    const notifyResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: NOTIFICATION_EMAIL,
        reply_to: email,
        subject: `New Lumarix Early Access Signup: ${email}`,
        html: notifyHtml,
      }),
    });

    if (!notifyResp.ok) {
      const errBody = await notifyResp.text();
      console.error('Admin notification failed:', notifyResp.status, errBody);
      // User already got their welcome email — don't fail their request.
    }

    return json({ success: true });
  } catch (err) {
    console.error('Beta signup error:', err);
    return json({ error: 'Server error. Please try again later.' }, 500);
  }
};
