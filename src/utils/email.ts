import nodemailer from "nodemailer";
import dotenv from "dotenv";

const trustedDomains = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "yahoo.com",
  "aol.com",
  "zoho.com",
]);

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const isSecure = SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: isSecure,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendVerificationEmail = async (
  email: string, 
  code: string, 
  name: string = "Pelanggan"
) => {
  
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Zona Hostspot" <${SMTP_USER}>`,
    to: email,
    subject: "Kode Verifikasi Zona Hotspot",
    html: `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Verifikasi Email</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style="
          margin: 0;
          font-family: 'Poppins', sans-serif;
          background: #ffffff;
          font-size: 14px;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 45px 30px 60px;
            background: #f4f7ff;
            background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
            background-repeat: no-repeat;
            background-size: 800px 452px;
            background-position: top center;
            font-size: 14px;
            color: #434343;
          "
        >
          <header>
            <table style="width: 100%;">
              <tbody>
                <tr style="height: 0;">
                  <td style="text-align: left;">
                    <span
                      style="font-size: 22px; line-height: 30px; color: #ffffff; font-weight: 600;"
                      >Zona Hotspot</span
                    >
                  </td>
                  <td style="text-align: right;">
                    <span
                      style="font-size: 14px; line-height: 30px; color: #ffffff;"
                      >${today}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </header>

          <main>
            <div
              style="
                margin: 0;
                margin-top: 70px;
                padding: 92px 30px 115px;
                background: #ffffff;
                border-radius: 30px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              "
            >
              <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f1f1f;
                  "
                >
                  Hai ${name}
                </h1>
                <p
                  style="
                    margin: 0;
                    margin-top: 17px;
                    font-weight: 500;
                    letter-spacing: 0.56px;
                    line-height: 1.6;
                    color: #555;
                  "
                >
                  Terima kasih telah bergabung dengan <b>Zona Hotspot</b>.<br/>
                  Gunakan kode di bawah ini untuk verifikasi akun Anda.
                </p>
                <p
                  style="
                    margin-top: 10px;
                    font-size: 13px;
                    color: #888;
                  "
                >
                  Kode valid selama <b>15 menit</b>. Jangan bagikan kepada siapa pun.
                </p>
                
                <p
                  style="
                    margin: 0;
                    margin-top: 40px;
                    font-size: 40px;
                    font-weight: 600;
                    letter-spacing: 15px;
                    color: #036bfc;
                    background: #f0f6ff;
                    padding: 15px;
                    border-radius: 10px;
                    display: inline-block;
                  "
                >
                  ${code}
                </p>
              </div>
            </div>
          </main>

          <footer
            style="
              width: 100%;
              max-width: 490px;
              margin: 20px auto 0;
              text-align: center;
              border-top: 1px solid #e6ebf1;
            "
          >
            <p
              style="
                margin: 0;
                margin-top: 40px;
                font-size: 18px;
                font-weight: 600;
                color: #434343;
              "
            >
              Zona Hotspot
            </p>
            <p style="margin: 0; margin-top: 8px; color: #888; font-size: 12px;">
              Solusi Internet Cepat & Stabil<br/>
              Cidaun - Cianjur
            </p>
            <div style="margin: 0; margin-top: 16px;">
              <a href="#" style="display: inline-block; text-decoration: none;">
                <img
                  width="30px"
                  alt="Facebook"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
                />
              </a>
              <a href="#" style="display: inline-block; margin-left: 8px; text-decoration: none;">
                <img
                  width="30px"
                  alt="Instagram"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
              /></a>
            </div>
            <p style="margin: 0; margin-top: 16px; color: #aaa; font-size: 12px;">
              Copyright © ${new Date().getFullYear()} Zona Hotspot. All rights reserved.
            </p>
          </footer>
        </div>
      </body>
    </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("error sending email", error);
  }
};

export const isEmailOnAllowList = (email: string): boolean => {
  if (!email || email.indexOf("@") === -1) {
    return false;
  }
  const domain = email.split("@")[1].toLowerCase();
  return trustedDomains.has(domain);
};