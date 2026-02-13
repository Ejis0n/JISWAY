import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  specText: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `procure:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, company, email, country, specText, quantity, notes } = parsed.data;

  const created = await prisma.procurementRequest.create({
    data: {
      status: "NEW",
      name: name.trim(),
      company: company.trim(),
      email,
      country: country.trim(),
      specText: specText.trim(),
      quantity: quantity ?? null,
      notes: notes?.trim() || null,
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      name: "SubmitProcure",
      path: "/procure",
      country,
    },
  });

  await prisma.appEvent.create({
    data: {
      type: "procure_submitted",
      meta: { id: created.id, email },
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || process.env.ADMIN_SEED_EMAIL?.trim();
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New procurement request (${created.id})`,
      text: [
        `ProcurementRequest ID: ${created.id}`,
        `Email: ${email}`,
        `Name: ${name}`,
        `Company: ${company}`,
        `Country: ${country}`,
        quantity ? `Quantity (packs): ${quantity}` : "",
        "",
        "Spec:",
        specText,
        "",
        notes ? `Notes: ${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  await sendEmail({
    to: email,
    subject: "Procurement request received",
    text: [
      "We received your procurement request.",
      "",
      `Request ID: ${created.id}`,
      "",
      "Notes:",
      "- No substitutes. Exact JIS specification.",
      "- Procured through Japan-based industrial supply chain.",
      "- Import duties and taxes are the responsibility of the recipient.",
    ].join("\n"),
  });

  return NextResponse.json({ ok: true, id: created.id });
}

