import { Resend } from "resend";
import { env } from "../config/env.js";

export function isResendConfigured(): boolean {
  return Boolean(env.resend.apiKey);
}

let cachedClient: Resend | null = null;
function client(): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(env.resend.apiKey);
  }
  return cachedClient;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isResendConfigured()) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  try {
    const result = await client().emails.send({
      from: env.resend.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html ?? `<pre>${input.text ?? ""}</pre>`,
      text: input.text ?? "",
      replyTo: input.replyTo,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, id: result.data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Batch send — best effort, returns per-recipient results. */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  body: { html?: string; text?: string },
): Promise<{ ok: boolean; sent: number; failures: number; error?: string }> {
  if (!isResendConfigured()) {
    return { ok: false, sent: 0, failures: recipients.length, error: "RESEND_API_KEY missing" };
  }
  let sent = 0;
  let failures = 0;
  for (const to of recipients) {
    const r = await sendEmail({ to, subject, html: body.html, text: body.text });
    if (r.ok) sent += 1;
    else failures += 1;
  }
  return { ok: failures === 0, sent, failures };
}
