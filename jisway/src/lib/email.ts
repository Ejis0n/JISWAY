import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
};

function canSend() {
  return Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM);
}

export async function sendEmail(input: SendEmailInput) {
  if (!canSend()) {
    // eslint-disable-next-line no-console
    console.log("[email skipped]", { to: input.to, subject: input.subject });
    return { skipped: true as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM as string;
  const res = await resend.emails.send({
    from,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
      content_type: a.contentType ?? "application/octet-stream",
    })),
  });
  return res;
}

