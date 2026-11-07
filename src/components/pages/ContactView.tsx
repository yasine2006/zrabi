"use client";

import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";

export function ContactView() {
  const { locale, t } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const whatsapp = getSupportWhatsAppLink({
    locale,
    message:
      locale === "ar"
        ? "مرحباً زربية أطلس، أود التواصل معكم."
        : locale === "en"
          ? "Hello Zarbia Atlas, I would like to get in touch."
          : "Bonjour Zarbia Atlas, je souhaite vous contacter.",
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = encodeURIComponent(
      `Nom: ${name}\nE-mail: ${email}\nMessage: ${message}`,
    );
    window.open(`${whatsapp}&text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">{t("Nous joindre", "Get in touch", "تواصل معنا")}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
          {t("Une question ? Écrivez-nous.", "A question? Write to us.", "هل لديك سؤال؟ اكتب لنا.")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t(
            "Nous répondons personnellement, sous 24 heures.",
            "We reply personally, within 24 hours.",
            "نجيب شخصياً، خلال 24 ساعة.",
          )}
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface/50 p-5 transition hover:border-terracotta"
          >
            <MessageCircle className="h-5 w-5 text-terracotta" />
            <div>
              <p className="text-sm font-semibold">WhatsApp</p>
              <p className="text-[0.72rem] text-muted">+212 6XX XXX XXX</p>
            </div>
          </a>
          <a
            href="mailto:bonjour@zarbia-atlas.ma"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface/50 p-5 transition hover:border-terracotta"
          >
            <Mail className="h-5 w-5 text-terracotta" />
            <div>
              <p className="text-sm font-semibold">E-mail</p>
              <p className="text-[0.72rem] text-muted">bonjour@zarbia-atlas.ma</p>
            </div>
          </a>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/50 p-5">
            <MapPin className="h-5 w-5 text-terracotta" />
            <div>
              <p className="text-sm font-semibold">
                {t("Atelier", "Atelier", "الورشة")}
              </p>
              <p className="text-[0.72rem] text-muted">
                Aït Bouguemez, Moyen Atlas, Maroc
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-line bg-background p-6 shadow-soft">
          <label className="block">
            <span className="field-label">{t("Nom", "Name", "الاسم")}</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
            />
          </label>
          <label className="block">
            <span className="field-label">{t("E-mail", "Email", "البريد الإلكتروني")}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </label>
          <label className="block">
            <span className="field-label">{t("Message", "Message", "الرسالة")}</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="field"
            />
          </label>
          <button type="submit" className="btn-primary">
            {t("Envoyer sur WhatsApp", "Send via WhatsApp", "أرسل عبر واتساب")}
            <ArrowRight className="h-4 w-4 rtl-flip" />
          </button>
        </form>
      </div>
    </div>
  );
}
