"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const { locale, t } = useStore();
  const reduceMotion = useReducedMotion();
  const href = getSupportWhatsAppLink({ locale });

  // Keep the initial style identical on the server and the client: the
  // reduced-motion preference is only known in the browser and would
  // otherwise trigger a hydration mismatch on every page.
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : 1.1,
        duration: reduceMotion ? 0 : 0.5,
      }}
      className="fixed bottom-5 right-4 z-40 sm:bottom-7 sm:right-6"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t(
          "Contacter notre concierge sur WhatsApp",
          "Message our concierge on WhatsApp",
        )}
        className="group flex items-center gap-3"
      >
        <span className="pointer-events-none hidden max-w-[13rem] translate-x-2 rounded-2xl border border-line bg-background/95 px-3.5 py-2.5 text-right text-[0.7rem] leading-snug text-ink opacity-0 shadow-soft backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
          <span className="block font-semibold">
            {t("Besoin d’un conseil ?", "Need a hand?")}
          </span>
          <span className="text-muted">
            {t("Parlez à notre concierge.", "Talk to our concierge.")}
          </span>
        </span>

        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#1f7a53] text-white shadow-lift transition-transform duration-300 group-hover:scale-105">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#1f7a53]/25" />
          <svg
            viewBox="0 0 24 24"
            className="relative h-7 w-7"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.04 2.001a9.84 9.84 0 0 0-8.42 14.94L2.1 21.9l5.08-1.49A9.84 9.84 0 1 0 12.04 2Zm0 1.67a8.17 8.17 0 1 1-4.17 15.22l-.3-.18-3.01.88.9-2.94-.2-.31A8.17 8.17 0 0 1 12.04 3.67Zm-2.8 4.02c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83s.79 2.12.9 2.27c.11.15 1.53 2.44 3.78 3.32 1.87.73 2.25.59 2.66.55.41-.04 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.22-.15-.46-.27-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41l-.46-.01Z" />
          </svg>
        </span>
      </a>
    </motion.div>
  );
}
