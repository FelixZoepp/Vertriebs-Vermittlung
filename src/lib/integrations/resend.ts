import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = "Zoepp Media <noreply@zoeppmedia.de>";

export async function sendMasterclassFreischaltung(
  email: string,
  name: string,
  loginUrl: string
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Deine Masterclass ist freigeschaltet!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hallo ${name},</h2>
        <p>Gratulation! Du hast dich qualifiziert und deine Masterclass ist jetzt freigeschaltet.</p>
        <p>Schau dir alle Module an, um für die Vermittlung an unsere Partnerunternehmen berücksichtigt zu werden.</p>
        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Masterclass starten
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Bei Fragen erreichst du uns jederzeit.<br>
          Dein Zoepp Media Team
        </p>
      </div>
    `,
  });
}

export async function sendPartnerKandidatVorgeschlagen(
  email: string,
  ansprechpartner: string,
  anzahl: number
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${anzahl} neue${anzahl === 1 ? "r" : ""} Kandidat${anzahl === 1 ? "" : "en"} für dich`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hallo ${ansprechpartner},</h2>
        <p>Wir haben ${anzahl === 1 ? "einen neuen Kandidaten" : `${anzahl} neue Kandidaten`} für dein Unternehmen gefunden.</p>
        <p>Schau dir ${anzahl === 1 ? "das Profil" : "die Profile"} im Portal an und melde dein Interesse an.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://vertriebs-vermittlung.vercel.app"}/partner/kandidaten" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Kandidaten ansehen
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Dein Zoepp Media Team
        </p>
      </div>
    `,
  });
}

export async function sendRechnungVersendet(
  email: string,
  ansprechpartner: string,
  rechnungsnummer: string,
  betrag: string,
  typ: string
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Rechnung ${rechnungsnummer} – ${betrag}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hallo ${ansprechpartner},</h2>
        <p>Wir haben eine neue Rechnung für dich erstellt:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Rechnungsnr.</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${rechnungsnummer}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Typ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${typ}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Betrag</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${betrag}</td></tr>
        </table>
        <p>Die Rechnung wird per SEPA-Lastschrift eingezogen.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://vertriebs-vermittlung.vercel.app"}/partner/rechnungen" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Rechnungen ansehen
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Dein Zoepp Media Team
        </p>
      </div>
    `,
  });
}

export async function sendMahnung(
  email: string,
  ansprechpartner: string,
  rechnungsnummer: string,
  betrag: string,
  stufe: "erinnerung" | "mahnung" | "eskalation"
) {
  const subjects: Record<string, string> = {
    erinnerung: `Zahlungserinnerung – Rechnung ${rechnungsnummer}`,
    mahnung: `Mahnung – Rechnung ${rechnungsnummer}`,
    eskalation: `Letzte Mahnung – Rechnung ${rechnungsnummer}`,
  };

  const bodies: Record<string, string> = {
    erinnerung:
      "wir möchten dich freundlich daran erinnern, dass die folgende Rechnung noch offen ist.",
    mahnung:
      "trotz unserer Erinnerung ist die folgende Rechnung weiterhin unbezahlt. Bitte überweise den Betrag umgehend.",
    eskalation:
      "dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen eingehen, behalten wir uns weitere Schritte vor.",
  };

  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: subjects[stufe],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hallo ${ansprechpartner},</h2>
        <p>${bodies[stufe]}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Rechnungsnr.</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${rechnungsnummer}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Betrag</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${betrag}</td></tr>
        </table>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Dein Zoepp Media Team
        </p>
      </div>
    `,
  });
}

export async function sendBewerberEingang(
  email: string,
  vorname: string
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Bewerbung eingegangen – Zoepp Media",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hallo ${vorname},</h2>
        <p>Vielen Dank für deine Bewerbung! Wir haben sie erhalten und melden uns in Kürze bei dir.</p>
        <p>So geht es weiter:</p>
        <ol style="line-height: 1.8;">
          <li>Wir prüfen dein Profil</li>
          <li>Erstgespräch mit unserem Team</li>
          <li>Masterclass-Freischaltung</li>
          <li>Vermittlung an ein Partnerunternehmen</li>
        </ol>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Dein Zoepp Media Team
        </p>
      </div>
    `,
  });
}
