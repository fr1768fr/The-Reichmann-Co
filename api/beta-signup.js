// Lumarix Beta Signup — Vercel serverless function
// Receives email, sends welcome email to signup + notification to admin via Resend API.

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const email = rawEmail.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@reichmannholdings.co.za';
    // Sender address. Use Resend's onboarding domain by default until reichmannholdings.co.za is verified in Resend.
    const FROM_ADDRESS = process.env.RESEND_FROM || 'Lumarix Beta <onboarding@resend.dev>';

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY environment variable is not set');
        return res.status(500).json({ error: 'Email service is not configured.' });
    }

    const escapeHtml = (s) =>
        String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const safeEmail = escapeHtml(email);
    const signupDate = new Date().toISOString();

    // Welcome email to the signup
    const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0f1c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1c;padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#0f172a;border:1px solid rgba(148,163,184,0.12);border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="padding:40px 40px 32px;">
                            <div style="display:inline-block;padding:6px 12px;background:rgba(201,166,117,0.12);border:1px solid rgba(212,184,138,0.4);border-radius:100px;font-size:11px;font-weight:500;color:#d4b88a;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:24px;">
                                Beta Access Confirmed
                            </div>
                            <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:-0.025em;line-height:1.2;color:#f8fafc;">
                                Welcome to the <span style="background:linear-gradient(135deg,#d4b88a,#c9a675);-webkit-background-clip:text;background-clip:text;color:transparent;">Lumarix</span> Beta
                            </h1>
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                Thanks for signing up. You've secured a spot on our accountant beta tester list for Lumarix, the next-generation Enterprise Resource Planning platform we're building at The Reichmann Co.
                            </p>
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                <strong style="color:#f8fafc;">What happens next?</strong><br>
                                When Lumarix is ready for beta testing, we'll email you directly with access details, login credentials, and onboarding instructions. No further action needed on your side for now.
                            </p>
                            <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#cbd5e1;">
                                If you have any questions in the meantime, just reply to this email.
                            </p>
                            <div style="padding-top:24px;border-top:1px solid rgba(148,163,184,0.12);">
                                <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;font-weight:500;">The Reichmann Co. (Pty) Ltd</p>
                                <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Reg. No. 2026/389746/07</p>
                                <p style="margin:0;font-size:13px;color:#64748b;">
                                    <a href="https://reichmannholdings.co.za" style="color:#d4b88a;text-decoration:none;">reichmannholdings.co.za</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;color:#475569;">
                    You're receiving this email because you signed up for the Lumarix beta at reichmannholdings.co.za.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

    // Notification email to admin (Franco)
    const notifyHtml = `<!DOCTYPE html>
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
                                New Lumarix Beta Signup
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
                                            <a href="mailto:${safeEmail}" style="color:#a88554;text-decoration:none;">${safeEmail}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0;font-size:13px;color:#94a3b8;">
                                Signed up via the Lumarix beta form on reichmannholdings.co.za.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    try {
        // Send welcome email (to the user who signed up)
        // Reply-To is set to info@... so replies don't bounce (beta@ has no mailbox)
        const welcomeResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_ADDRESS,
                to: email,
                reply_to: NOTIFICATION_EMAIL,
                subject: 'Welcome to the Lumarix Beta',
                html: welcomeHtml
            })
        });

        if (!welcomeResp.ok) {
            const errBody = await welcomeResp.text();
            console.error('Welcome email failed:', welcomeResp.status, errBody);
            return res.status(502).json({ error: 'Could not send welcome email. Please try again later.' });
        }

        // Send notification email (to admin)
        const notifyResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_ADDRESS,
                to: NOTIFICATION_EMAIL,
                reply_to: email,
                subject: `New Lumarix Beta Signup: ${email}`,
                html: notifyHtml
            })
        });

        if (!notifyResp.ok) {
            const errBody = await notifyResp.text();
            console.error('Admin notification failed:', notifyResp.status, errBody);
            // Don't fail the request — the user already got their welcome email.
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Beta signup error:', err);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};
