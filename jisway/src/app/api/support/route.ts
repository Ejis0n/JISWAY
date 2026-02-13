import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  name: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  email: z.string().email(),
  country: z.string().max(50).optional(),
  order_id: z.string().max(100).optional(),
  category: z.enum(["misorder", "damage", "lost", "customs", "billing", "other"]).default("other"),
  message: z.string().min(5).max(5000),
  attachment_urls: z.array(z.string().url()).max(10).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `support:${ip}`, limit: 20, windowMs: 60_000 });
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

  const t = await prisma.supportTicket.create({
    data: {
      name: parsed.data.name,
      company: parsed.data.company,
      email: parsed.data.email,
      country: parsed.data.country,
      orderId: parsed.data.order_id,
      category: parsed.data.category,
      message: parsed.data.message,
      attachments: parsed.data.attachment_urls?.length
        ? {
            create: parsed.data.attachment_urls.map((u) => ({ fileUrl: u, kind: "photo" })),
          }
        : undefined,
    },
  });

  await prisma.appEvent.create({
    data: {
      type: "support_ticket_created",
      meta: { ticketId: t.id, category: t.category, orderId: t.orderId, email: t.email },
    },
  });

  // Evidence: store support communication against Order when order_id matches
  if (t.orderId) {
    const order = await prisma.order.findUnique({ where: { id: t.orderId } });
    if (order) {
      await prisma.orderEvidence.create({
        data: {
          orderId: order.id,
          type: "communication",
          textContent: [
            "Support ticket created",
            `ticket_id: ${t.id}`,
            `category: ${t.category}`,
            `email: ${t.email}`,
            `country: ${t.country ?? ""}`,
            "",
            t.message,
          ].join("\n"),
        },
      });

      const urls = parsed.data.attachment_urls ?? [];
      if (urls.length) {
        const photoType = t.category === "damage" ? "packaging_photo" : "item_photo";
        await prisma.orderEvidence.createMany({
          data: urls.slice(0, 10).map((u) => ({
            orderId: order.id,
            type: photoType as any,
            fileUrl: u,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, ticket_id: t.id });
}

