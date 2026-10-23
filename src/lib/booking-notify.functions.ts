import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  email: z.string().trim().min(3).max(255),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time: z.string().trim().min(1).max(60),
});

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/**
 * Emails the studio when a new booking request arrives, using the Resend API.
 *
 * Secrets (server environment):
 *   RESEND_API_KEY  required — if missing, nothing is sent (the booking is still saved)
 *   NOTIFY_EMAIL    optional — recipient, defaults to studiolunaray@gmail.com
 *   RESEND_FROM     optional — sender, defaults to "Lunaray Studio <onboarding@resend.dev>"
 *
 * The email body is built from the saved booking row, not from the request, and only
 * a recently created pending booking can trigger it, so the endpoint can't be used to
 * send arbitrary mail. It never throws: failures are logged and reported as { sent: false }.
 */
export const notifyNewBooking = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }): Promise<{ sent: boolean }> => {
    try {
      const apiKey = process.env["RESEND_API_KEY"];
      if (!apiKey) {
        console.warn("[booking-notify] RESEND_API_KEY is not set; skipping email.");
        return { sent: false };
      }
      const to = process.env["NOTIFY_EMAIL"] || "studiolunaray@gmail.com";
      const from = process.env["RESEND_FROM"] || "Lunaray Studio <onboarding@resend.dev>";

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: rows, error } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .eq("email", data.email)
        .eq("booking_date", data.booking_date)
        .eq("preferred_time", data.preferred_time)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);
      const b = rows?.[0];
      if (error || !b) {
        console.warn("[booking-notify] No matching recent pending booking; skipping email.", error?.message);
        return { sent: false };
      }

      const { getRequest } = await import("@tanstack/react-start/server");
      const origin = new URL(getRequest().url).origin;

      const line = (label: string, value: unknown) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#666;vertical-align:top">${label}</td><td style="padding:6px 0"><strong>${esc(value)}</strong></td></tr>`;
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
<h2 style="margin:0 0 4px">New booking request</h2>
<p style="margin:0 0 16px;color:#666">Lunaray Studio — awaiting your approval.</p>
<table style="border-collapse:collapse;font-size:15px">
${line("Name", b.full_name)}${line("Email", b.email)}${line("Phone", b.phone)}${line("Service", b.service)}
${line("Date", b.booking_date + (b.end_date ? ` → ${b.end_date}` : ""))}${line("Time", b.preferred_time)}
${line("Location", b.location)}${line("Message", b.message || "—")}
</table>
<p style="margin-top:20px"><a href="${esc(origin)}/admin" style="background:#2f4a3a;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px">Review &amp; approve</a></p>
</div>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: b.email,
          subject: `New booking request — ${b.full_name} (${b.booking_date})`,
          html,
        }),
      });
      if (!res.ok) {
        console.error("[booking-notify] Resend error", res.status, await res.text());
        return { sent: false };
      }
      return { sent: true };
    } catch (e) {
      console.error("[booking-notify] failed", e);
      return { sent: false };
    }
  });
