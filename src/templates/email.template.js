const nodemailer = require('nodemailer');
const path = require('path');
const env = require('../../config/env');

/**
 * Transporter configuration using application environment variables
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.SECURE,
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
});

const LOGO_PATH = path.join(__dirname, '../../public/images/estrella-logo.png');

/**
 * Format a 6-digit OTP string with a center space for readability.
 * e.g. "382104" → "382 104"
 *
 * @param {string|number} otp
 * @returns {string}
 */
const formatOtp = (otp) => {
  const str = String(otp).replace(/\s/g, '');
  if (str.length === 6) {
    return `${str.slice(0, 3)} ${str.slice(3)}`;
  }
  return str;
};

/**
 * Generate a responsive HTML email template adhering to the
 * Estrella Kinetic Performance design system (Dark Charcoal Theme).
 *
 * @param {Object} options
 * @param {string} options.title        - Email document title
 * @param {string} options.heading      - Main headline (e.g. "LOGIN VERIFICATION")
 * @param {string} options.message      - Body instruction message
 * @param {string|number} options.otp   - 6-digit dynamic OTP code
 * @param {string} options.subtext      - Expiration / security notice
 * @returns {string} Fully rendered HTML email
 */
const getEmailHtml = ({ title, heading, message, otp, subtext }) => {
  const currentYear = new Date().getFullYear();
  const formattedOtp = formatOtp(otp);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title || heading}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #1E2228; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-body { padding: 32px 20px !important; }
      .otp-text { font-size: 26px !important; letter-spacing: 5px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #1E2228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Outer Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1E2228; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 44px 16px 48px 16px;">

        <!-- Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 520px; margin: 0 auto; background-color: #252A32; border: 1px solid #383E4D; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45);">

          <!-- Header: frosted dark charcoal -->
          <tr>
            <td align="center" style="background-color: #2C3140; border-bottom: 1px solid #383E4D; padding: 30px 24px 22px 24px;">
              <!-- Logo -->
              <img src="cid:estrella-logo" alt="Estrella" width="120" style="display: block; max-width: 130px; height: auto; margin: 0 auto 14px auto; border: 0;" />
              <!-- Brand subtitle -->
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 2.8px; text-transform: uppercase; color: #00D71B;">
                ESTRELLA &bull; KINETIC PERFORMANCE
              </div>
            </td>
          </tr>

          <!-- Card Body -->
          <tr>
            <td class="card-body" style="padding: 36px 40px 40px 40px; text-align: center; background-color: #252A32;">

              <!-- Heading -->
              <h1 style="color: #00D71B; font-size: 20px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 12px 0; line-height: 1.3;">
                ${heading}
              </h1>

              <!-- Message -->
              <p style="color: #B0B8C8; font-size: 14px; line-height: 1.65; margin: 0 0 28px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
                ${message}
              </p>

              <!-- OTP Block -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #00D71B; border-radius: 12px; padding: 16px 36px; box-shadow: 0 4px 18px rgba(0, 215, 27, 0.22);">
                          <span class="otp-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace; font-size: 30px; font-weight: 500; letter-spacing: 8px; color: #0A0A0A; display: inline-block; padding-left: 8px; line-height: 1.1;">
                            ${formattedOtp}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="color: #8892A4; font-size: 13px; line-height: 1.55; margin: 0 0 32px 0; max-width: 380px; margin-left: auto; margin-right: auto;">
                ${subtext || 'This code is valid for 10 minutes. If you did not request this, please ignore it.'}
              </p>

              <!-- Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td style="border-top: 1px solid #383E4D;"></td>
                </tr>
              </table>

              <!-- Star watermark accent + Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <!-- Subtle star accent -->
                    <div style="font-size: 16px; color: #00D71B; letter-spacing: 8px; margin-bottom: 10px;">&#10022;&nbsp;&nbsp;&#10022;&nbsp;&nbsp;&#10022;</div>

                    <!-- Copyright -->
                    <p style="color: #6B7585; font-size: 11px; margin: 0; line-height: 1.5;">
                      &copy; ${currentYear} Estrella Kinetic Performance. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Below-card note -->
        <p style="color: #5A6270; font-size: 11px; margin: 16px 0 0 0; text-align: center;">
          If you did not request this email, you can safely ignore it.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;
};

/**
 * Send Login Verification OTP email
 *
 * @param {string} email - Recipient email address
 * @param {string|number} otp - 6-digit verification code
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendVerificationEmail = async (email, otp) => {
  const htmlContent = getEmailHtml({
    title: 'Estrella Verification',
    heading: 'LOGIN VERIFICATION',
    message: 'Use this code to complete your Kinetic Performance login.',
    otp,
    subtext: 'This code is valid for 10 minutes. If you did not request this, please ignore it.',
  });

  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: `${formatOtp(otp)} is your Kinetic Performance verification code`,
    html: htmlContent,
    attachments: [
      {
        filename: 'estrella-logo.png',
        path: LOGO_PATH,
        cid: 'estrella-logo',
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset OTP email
 *
 * @param {string} email - Recipient email address
 * @param {string|number} otp - 6-digit reset code
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendPasswordResetEmail = async (email, otp) => {
  const htmlContent = getEmailHtml({
    title: 'Estrella Password Reset',
    heading: 'PASSWORD RESET',
    message: 'Use this code to reset your Kinetic Performance password.',
    otp,
    subtext: 'This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.',
  });

  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: `${formatOtp(otp)} is your Kinetic Performance password reset code`,
    html: htmlContent,
    attachments: [
      {
        filename: 'estrella-logo.png',
        path: LOGO_PATH,
        cid: 'estrella-logo',
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
