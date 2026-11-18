"use client";

import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen">
      {/* Header Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-ink text-white">
        <Image
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=85"
          alt="Art de vivre et artisanat marocain"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
        <div className="container-page relative z-10 py-16 sm:py-24">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-white/60"
          >
            <Link href="/" className="transition hover:text-gold">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-gold">{t("Contact", "Contact", "اتصل بنا")}</span>
          </nav>

          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[0.7rem] font-medium tracking-[0.2em] text-gold uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {t("Nous joindre", "Get in touch", "تواصل معنا")}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              {t("Une question ? Écrivez-nous.", "A question? Write to us.", "هل لديك سؤال؟ اكتب لنا.")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              {t(
                "Nous répondons personnellement, sous 24 heures par WhatsApp ou e-mail.",
                "We reply personally, within 24 hours via WhatsApp or email.",
                "نجيب شخصياً، خلال 24 ساعة عبر واتساب أو البريد الإلكتروني.",
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
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
    </div>
  );
}
