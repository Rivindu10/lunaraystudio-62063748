import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT, SERVICES } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Lunaray Studio" },
      { name: "description", content: "Contact Lunaray Studio by phone, WhatsApp or email to discuss your photography session." },
      { property: "og:title", content: "Contact Lunaray Studio" },
      { property: "og:description", content: "Let's talk about your story — call, WhatsApp or email us." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = Object.fromEntries(new FormData(form).entries()) as unknown as { name: string; email: string; service: string; message: string };
    const errs: { name?: string; email?: string; message?: string } = {};
    if (!v.name?.trim()) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email ?? "")) errs.email = "Please enter a valid email.";
    if (!v.message?.trim()) errs.message = "Please write a message.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert({
      name: v.name.trim().slice(0, 120),
      email: v.email.trim().slice(0, 255),
      service: v.service || null,
      message: v.message.trim().slice(0, 2000),
    });
    if (error) return setStatus("error");
    form.reset();
    setStatus("sent");
  };

  const items = [
    { icon: Phone, label: "Mobile", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phoneTel}` },
    { icon: MessageCircle, label: "WhatsApp", value: "Message us", href: CONTACT.whatsapp, ext: true },
    { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  ];

  return (
    <>
      <PageHeader eyebrow="Contact" title={<>Let's talk about <em>your story</em></>}>
        Whether you're planning a wedding, celebrating a graduation or hosting an event — we'd love to hear from you.
      </PageHeader>
      <section className="mx-auto grid max-w-6xl gap-16 px-5 py-20 md:grid-cols-[1fr_1.3fr] md:px-8">
        <div>
          <h2 className="font-serif text-4xl text-forest">Lunaray Studio</h2>
          <ul className="mt-10 space-y-8">
            {items.map(({ icon: Icon, label, value, href, ext }) => (
              <li key={label}>
                <a href={href} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined} className="group flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest/30 text-forest transition group-hover:bg-forest group-hover:text-forest-foreground"><Icon className="h-4 w-4" /></span>
                  <span>
                    <span className="eyebrow block text-muted-foreground">{label}</span>
                    <span className="mt-1 block break-all text-forest group-hover:text-primary">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <Button asChild variant="brand" size="xl" className="mt-10">
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </Button>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5 border border-border bg-card p-6 md:p-10">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" maxLength={120} className="mt-2 h-11" />
            {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" maxLength={255} className="mt-2 h-11" />
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="service">Service interest</Label>
            <select id="service" name="service" defaultValue="" className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="">Not sure yet</option>
              {SERVICES.map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" name="message" rows={6} maxLength={2000} className="mt-2" />
            {errors.message && <p className="mt-1.5 text-xs text-destructive">{errors.message}</p>}
          </div>
          {status === "sent" && <p className="border-l-2 border-primary bg-lime/30 px-4 py-3 text-sm text-forest" role="status">Thank you — your message has been sent. We'll be in touch soon.</p>}
          {status === "error" && <p className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">Something went wrong. Please try again or reach us on WhatsApp.</p>}
          <Button type="submit" variant="brand" size="xl" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? <><Loader2 className="animate-spin" /> Sending…</> : "Send Message"}
          </Button>
        </form>
      </section>
    </>
  );
}
