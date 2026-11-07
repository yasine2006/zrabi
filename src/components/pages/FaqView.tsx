"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Package,
  Search,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { getSupportWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Category = "orders" | "authenticity" | "payment" | "bespoke";

interface FaqEntry {
  id: string;
  category: Category;
  qFr: string;
  qEn: string;
  qAr?: string;
  aFr: string;
  aEn: string;
  aAr?: string;
}

const CATEGORIES: Array<{
  id: Category | "all";
  labelFr: string;
  labelEn: string;
  labelAr?: string;
  icon: typeof Package;
}> = [
  { id: "all", labelFr: "Tout", labelEn: "All", labelAr: "الكل", icon: Sparkles },
  { id: "orders", labelFr: "Commande & livraison", labelEn: "Order & shipping", labelAr: "الطلب والتوصيل", icon: Truck },
  { id: "authenticity", labelFr: "Authenticité & entretien", labelEn: "Authenticity & care", labelAr: "الأصالة والصيانة", icon: BadgeCheck },
  { id: "payment", labelFr: "Paiement", labelEn: "Payment", labelAr: "الدفع", icon: CreditCard },
  { id: "bespoke", labelFr: "Sur mesure", labelEn: "Bespoke", labelAr: "حسب الطلب", icon: Package },
];

const FAQS: readonly FaqEntry[] = [
  {
    id: "shipping-countries",
    category: "orders",
    qFr: "Où livrez-vous et en combien de temps ?",
    qEn: "Where do you ship, and how long does it take?",
    qAr: "إلى أين تشحنون وكم يستغرق التوصيل؟",
    aFr:
      "Nous expédions vers plus de 60 destinations : Maroc, Europe, Amérique du Nord et Moyen-Orient. Maroc : 1 à 3 jours ouvrés. Europe : 4 à 7 jours. Amérique du Nord : 6 à 10 jours. Chaque envoi est suivi et remis contre signature. Le coût exact est calculé au checkout selon le poids et la destination.",
    aEn:
      "We ship to more than 60 destinations: Morocco, Europe, North America and the Middle East. Morocco: 1–3 business days. Europe: 4–7 days. North America: 6–10 days. Every parcel is tracked and delivered against signature. The exact cost is calculated at checkout from the weight and destination.",
    aAr:
      "نشحن إلى أكثر من 60 وجهة: المغرب، أوروبا، أمريكا الشمالية والشرق الأوسط. المغرب: 1 إلى 3 أيام عمل. أوروبا: 4 إلى 7 أيام. أمريكا الشمالية: 6 إلى 10 أيام. كل شحنة متتبعة وتُسلَّم مقابل التوقيع. يُحسب السعر النهائي عند الدفع حسب الوزن والوجهة.",
  },
  {
    id: "shipping-cost",
    category: "orders",
    qFr: "Comment est calculée la livraison ?",
    qEn: "How is shipping calculated?",
    qAr: "كيف يُحسب سعر الشحن؟",
    aFr:
      "Le tarif dépend de la zone et du poids total du colis, pas du prix du tapis. Un tapis de 8 kg vers la France n’a pas le même coût qu’un envoi de 20 kg vers les États-Unis. Le montant apparaît en temps réel dès que vous saisissez le pays, avant tout paiement.",
    aEn:
      "The rate depends on the zone and the total parcel weight, not on the rug price. An 8 kg rug to France does not cost the same as a 20 kg shipment to the United States. The amount appears live as soon as you enter the country, before any payment.",
    aAr:
      "يتوقف السعر على المنطقة والوزن الإجمالي للشحنة، لا على سعر الزربية. زربية بوزن 8 كغ إلى فرنسا ليست كشحنة 20 كغ إلى الولايات المتحدة. يظهر المبلغ فور اختيار البلد، قبل أي دفع.",
  },
  {
    id: "hold",
    category: "orders",
    qFr: "Que se passe-t-il si je mets un tapis au panier ?",
    qEn: "What happens when I add a rug to the cart?",
    qAr: "ماذا يحدث عند إضافة زربية إلى السلة؟",
    aFr:
      "Chaque tapis est une pièce unique. L’ajout au panier crée une réservation de 15 minutes, visible dans le panier et au checkout. Si vous ne finalisez pas, la pièce redevient disponible pour un autre client. Un compte à rebours vous indique le temps restant et peut être relancé.",
    aEn:
      "Every rug is one of a kind. Adding it to the cart creates a 15-minute hold, visible in the cart and at checkout. If you do not complete the order, the piece becomes available again. A countdown shows the remaining time and can be refreshed.",
    aAr:
      "كل زربية قطعة فريدة. تضيف الإضافة إلى السلة حجزاً لمدة 15 دقيقة، يظهر في السلة وعند الدفع. إن لم تُكمل الطلب، تعود القطعة متاحة لعميل آخر. يعرض عدّاد تنازلي الوقت المتبقي ويمكن تجديده.",
  },
  {
    id: "returns",
    category: "orders",
    qFr: "Puis-je retourner un tapis ?",
    qEn: "Can I return a rug?",
    qAr: "هل يمكنني إرجاع زربية؟",
    aFr:
      "Oui, sous 14 jours après réception, si la pièce n’a pas été utilisée et qu’elle est dans son emballage d’origine. Les frais de retour restent à votre charge, sauf erreur de notre part ou défaut caché. Les pièces sur mesure ne sont ni échangées ni remboursées une fois le tissage commencé.",
    aEn:
      "Yes, within 14 days of delivery, provided the piece is unused and in its original packaging. Return shipping is at your cost unless the error is ours or there is a hidden defect. Bespoke pieces cannot be exchanged or refunded once weaving has begun.",
    aAr:
      "نعم، خلال 14 يوماً من الاستلام، شرط ألا تكون القطعة مستعملة وأن تكون في تغليفها الأصلي. تبقى تكاليف الإرجاع على عاتقك، إلا إذا كان الخطأ منّا أو كان هناك عيب خفي. القطع حسب الطلب لا تُستبدل ولا تُسترجع بعد بدء النسج.",
  },
  {
    id: "authenticity",
    category: "authenticity",
    qFr: "Comment savoir qu’un tapis est vraiment fait main ?",
    qEn: "How do I know a rug is genuinely handmade?",
    qAr: "كيف أعرف أن الزربية مصنوعة يدوياً حقاً؟",
    aFr:
      "Chaque pièce est nouée sur un métier de bois, sans carton industriel. Les irrégularités de motif, de lisière et de dimensions sont normales et signent le travail manuel. Nous photographions la pièce, mesurons ses dimensions réelles et joignons un certificat nominatif signé par l’artisane, avec son village et son temps de tissage.",
    aEn:
      "Every piece is knotted on a wooden loom, without an industrial template. Irregularities in motif, edge and dimensions are normal and are the signature of handwork. We photograph the piece, measure its real dimensions and include a named certificate signed by the artisan, with her village and weaving time.",
    aAr:
      "تُنسج كل قطعة على نول خشبي، دون قالب صناعي. عدم انتظام النقش والحاشية والمقاسات أمر طبيعي وهو بصمة العمل اليدوي. نصوّر القطعة ونقيس أبعادها الحقيقية ونرفق شهادة اسمية موقّعة من الحرفية، مع قريتها ومدة النسج.",
  },
  {
    id: "materials",
    category: "authenticity",
    qFr: "Quelles matières utilisez-vous ?",
    qEn: "Which materials do you use?",
    qAr: "ما المواد التي تستخدمونها؟",
    aFr:
      "Laine de mouton, coton naturel pour la trame, et teintures végétales ou soigneusement sélectionnées. Les Boucherouite utilisent des textiles recyclés, par tradition. Nous refusons les fibres synthétiques dans les pièces de laine et signalons toujours les mélanges lorsqu’ils existent.",
    aEn:
      "Sheep wool, natural cotton for the warp, and plant-based or carefully selected dyes. Boucherouite rugs use recycled textiles by tradition. We refuse synthetic fibres in wool pieces and always disclose blends when they exist.",
    aAr:
      "صوف خروف، قطن طبيعي للسداة، وأصباغ نباتية أو مختارة بعناية. تستخدم زرابي بوشرويط منسوجات معاد تدويرها بحكم التقليد. نرفض الألياف الاصطناعية في قطع الصوف ونعلن دائماً عن أي خلط عند وجوده.",
  },
  {
    id: "cleaning",
    category: "authenticity",
    qFr: "Comment entretenir mon tapis au quotidien ?",
    qEn: "How should I care for my rug day to day?",
    qAr: "كيف أعتني بزرابتي يومياً؟",
    aFr:
      "Aspirez une fois par semaine sans brosse rotative, retournez la pièce tous les trois mois et évitez le soleil direct prolongé. Pour une tache, tamponnez à l’eau froide avec un savon neutre, sans frotter, puis séchez à plat. Jamais de machine à laver, de sèche-linge ni de nettoyeur vapeur. Un nettoyage professionnel tous les trois à cinq ans suffit.",
    aEn:
      "Vacuum once a week without a rotating brush, rotate the piece every three months and avoid prolonged direct sunlight. For a stain, blot with cold water and mild soap, without rubbing, then dry flat. Never use a washing machine, tumble dryer or steam cleaner. A professional clean every three to five years is enough.",
    aAr:
      "اكنس مرة في الأسبوع دون فرشاة دوّارة، واقلب القطعة كل ثلاثة أشهر وتجنّب أشعة الشمس المباشرة الطويلة. للبقع، جفّف بماء بارد وصابون لطيف دون فرك، ثم اتركها تجف مسطحة. لا تستخدم الغسالة أو المجفّف أو منظّف البخار أبداً. تنظيف مهني كل ثلاث إلى خمس سنوات يكفي.",
  },
  {
    id: "shedding",
    category: "authenticity",
    qFr: "Mon tapis perd des fibres, est-ce normal ?",
    qEn: "My rug is shedding. Is that normal?",
    qAr: "زربيتي تفقد أليافاً، هل هذا طبيعي؟",
    aFr:
      "Oui, surtout les premières semaines. La laine non teintée libère des fibres courtes issues du nouage. Aspirez doucement, sans brosse, et la perte diminue en quelques semaines. Une perte abondante et continue au-delà de trois mois peut signaler un nouage lâche : contactez-nous avec une photo.",
    aEn:
      "Yes, especially in the first weeks. Undyed wool releases short fibres from the knotting process. Vacuum gently, without a brush, and shedding decreases within weeks. Heavy, continuous shedding beyond three months may indicate loose knotting: contact us with a photo.",
    aAr:
      "نعم، خاصة في الأسابيع الأولى. يُطلق الصوف غير المصبوغ أليافاً قصيرة ناتجة عن العقد. اكنس بلطف دون فرشاة، وستقل الكمية خلال أسابيع. التساقط الغزير المستمر بعد ثلاثة أشهر قد يشير إلى عقد مرتخٍ: تواصل معنا مع صورة.",
  },
  {
    id: "payment",
    category: "payment",
    qFr: "Quels moyens de paiement acceptez-vous ?",
    qEn: "Which payment methods do you accept?",
    qAr: "ما وسائل الدفع المقبولة؟",
    aFr:
      "Au Maroc : paiement à la livraison (espèces), CMI pour les cartes marocaines, ou Stripe pour les cartes internationales. À l’international : Stripe uniquement, en EUR ou USD. Aucun numéro de carte n’est stocké sur nos serveurs.",
    aEn:
      "In Morocco: cash on delivery, CMI for Moroccan cards, or Stripe for international cards. Internationally: Stripe only, in EUR or USD. No card number is ever stored on our servers.",
    aAr:
      "في المغرب: الدفع عند الاستلام (نقداً)، CMI للبطاقات المغربية، أو Stripe للبطاقات الدولية. دولياً: Stripe فقط، باليورو أو الدولار. لا يُخزَّن أي رقم بطاقة على خوادمنا.",
  },
  {
    id: "cod",
    category: "payment",
    qFr: "Comment fonctionne le paiement à la livraison ?",
    qEn: "How does cash on delivery work?",
    qAr: "كيف يعمل الدفع عند الاستلام؟",
    aFr:
      "Disponible au Maroc uniquement. Vous ne payez rien à la commande : notre équipe vous appelle pour confirmer, puis le transporteur encaisse le montant total en dirhams à la remise. Préparez l’appoint, le transporteur ne dispose pas toujours de monnaie.",
    aEn:
      "Available in Morocco only. You pay nothing when ordering: our team calls to confirm, then the carrier collects the full amount in dirhams on handover. Have the exact amount ready; the carrier may not carry change.",
    aAr:
      "متاح في المغرب فقط. لا تدفع شيئاً عند الطلب: يتصل بك فريقنا للتأكيد، ثم يحصّل الناقل المبلغ الإجمالي بالدرهم عند التسليم. جهّز المبلغ بالضبط، فليس لدى الناقل دائماً فكة.",
  },
  {
    id: "security",
    category: "payment",
    qFr: "Le paiement en ligne est-il sécurisé ?",
    qEn: "Is online payment secure?",
    qAr: "هل الدفع الإلكتروني آمن؟",
    aFr:
      "Les paiements sont traités par Stripe ou par le CMI, avec 3-D Secure pour les cartes marocaines. Nous ne voyons ni ne stockons les données de carte. La page de confirmation ne valide jamais un paiement : seul le signal sécurisé du prestataire fait foi.",
    aEn:
      "Payments are processed by Stripe or CMI, with 3-D Secure for Moroccan cards. We neither see nor store card data. The confirmation page never validates a payment: only the provider’s secure signal does.",
    aAr:
      "تُعالَج المدفوعات عبر Stripe أو CMI، مع 3-D Secure للبطاقات المغربية. لا نرى ولا نخزّن بيانات البطاقة. صفحة التأكيد لا تُصادق أبداً على الدفع: فقط الإشارة الآمنة من مزوّد الخدمة هي المرجع.",
  },
  {
    id: "promo",
    category: "payment",
    qFr: "Comment utiliser un code promo ?",
    qEn: "How do I use a promo code?",
    qAr: "كيف أستخدم رمز الخصم؟",
    aFr:
      "Saisissez le code dans le panier ou dans le récapitulatif du checkout, puis validez. La remise s’applique uniquement au sous-total des tapis, jamais aux frais de livraison. Les codes actifs sont ATLAS10 (−10 %) et WELCOME5 (−5 %).",
    aEn:
      "Enter the code in the cart or the checkout summary, then apply it. The discount applies to the rug subtotal only, never to shipping. Active codes are ATLAS10 (−10%) and WELCOME5 (−5%).",
    aAr:
      "أدخل الرمز في السلة أو في ملخص الدفع ثم فعّله. يُطبَّق الخصم على مجموع الزرابي فقط، ولا يشمل الشحن أبداً. الرموز النشطة هي ATLAS10 (−10%) وWELCOME5 (−5%).",
  },
  {
    id: "bespoke",
    category: "bespoke",
    qFr: "Comment commander un tapis sur mesure ?",
    qEn: "How do I commission a bespoke rug?",
    qAr: "كيف أطلب زربية حسب المقاس؟",
    aFr:
      "Utilisez le configurateur : choisissez la tradition, les dimensions, les laines et le motif. Le prix au m² et l’acompte de 30 % s’affichent en direct. Nous revenons sous 48 heures ouvrées avec un dessin, un devis ferme et une date de mise sur métier. Aucun acompte n’est prélevé avant votre accord écrit.",
    aEn:
      "Use the builder: choose the tradition, dimensions, wools and motif. The price per square metre and the 30% deposit appear live. We come back within two business days with a sketch, a firm quote and a loom date. No deposit is taken before your written approval.",
    aAr:
      "استخدم أداة التصميم: اختر التقليد والمقاسات والصوف والنقش. يظهر سعر المتر المربع والدفعة المقدمة 30% مباشرة. نعود إليك خلال 48 ساعة عمل برسم وتقدير نهائي وموعد للنسج. لا تُحصَّل أي دفعة قبل موافقتك الكتابية.",
  },
  {
    id: "bespoke-delay",
    category: "bespoke",
    qFr: "Combien de temps prend une pièce sur mesure ?",
    qEn: "How long does a bespoke piece take?",
    qAr: "كم يستغرق إنجاز قطعة حسب الطلب؟",
    aFr:
      "Comptez généralement 6 à 12 semaines de tissage selon la surface et la densité du motif, auxquelles s’ajoutent 1 à 2 semaines de finition et d’expédition. Le délai estimé s’affiche dans le configurateur et est confirmé dans le devis.",
    aEn:
      "Typically 6 to 12 weeks of weaving depending on surface and motif density, plus 1–2 weeks for finishing and dispatch. The estimate appears in the builder and is confirmed in the quote.",
    aAr:
      "احسب عادة من 6 إلى 12 أسبوعاً من النسج حسب المساحة وكثافة النقش، تُضاف إليها أسبوع إلى أسبوعين للإنهاء والشحن. تظهر المدة التقديرية في أداة التصميم وتُؤكَّد في التقدير.",
  },
  {
    id: "photo",
    category: "authenticity",
    qFr: "Les photos sont-elles fidèles à la pièce ?",
    qEn: "Are the photos faithful to the piece?",
    qAr: "هل الصور مطابقة للقطعة؟",
    aFr:
      "Nous photographions chaque tapis en lumière naturelle, sans retouche de couleur. Les écrans variant, une légère différence de nuance est possible. Si vous hésitez sur une teinte, demandez-nous une photo ou une vidéo supplémentaire par WhatsApp avant de commander.",
    aEn:
      "We photograph every rug in natural light without colour retouching. Screens vary, so a slight difference in shade is possible. If you are unsure about a tone, ask us for an extra photo or video on WhatsApp before ordering.",
    aAr:
      "نصوّر كل زربية في ضوء طبيعي دون تعديل الألوان. تختلف الشاشات، لذا قد يظهر فرق طفيف في الدرجة. إن كنت متردداً في لون، اطلب منا صورة أو فيديو إضافياً عبر واتساب قبل الطلب.",
  },
];

export function FaqView() {
  const { locale, t } = useStore();
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  const whatsapp = getSupportWhatsAppLink({
    locale,
    message:
      locale === "ar"
        ? "مرحباً زربية أطلس، لدي سؤال غير موجود في الأسئلة الشائعة."
        : locale === "en"
          ? "Hello Zarbia Atlas, I have a question that is not in the FAQ."
          : "Bonjour Zarbia Atlas, j’ai une question qui n’est pas dans la FAQ.",
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return FAQS.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (!term) return true;

      const haystack = [
        entry.qFr,
        entry.qEn,
        entry.qAr ?? "",
        entry.aFr,
        entry.aEn,
        entry.aAr ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [category, query]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/70 bg-surface/35">
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-50" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">FAQ</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow-line">
                {t("Questions fréquentes", "Frequently asked", "الأسئلة الشائعة")}
              </p>
              <h1 className="mt-4 max-w-2xl text-balance font-serif text-[2.9rem] font-semibold leading-[0.96] tracking-[-0.035em] sm:text-[4.2rem]">
                {t(
                  "Tout ce qu’on nous demande avant de choisir.",
                  "Everything people ask before choosing.",
                  "كل ما يسألوننا عنه قبل الاختيار.",
                )}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-[1.75] text-muted lg:justify-self-end">
              {t(
                "Livraison, authenticité, entretien, paiement et sur-mesure. Si votre question n’est pas ici, écrivez-nous : nous répondons en moins d’un jour ouvré.",
                "Shipping, authenticity, care, payment and bespoke. If your question is not here, message us: we reply within one business day.",
                "الشحن، الأصالة، العناية، الدفع والطلب الخاص. إن لم تجد سؤالك هنا، راسلنا: نجيب في أقل من يوم عمل.",
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[16rem_1fr] lg:gap-12 lg:py-14">
        {/* Sidebar */}
        <aside>
          <div className="lg:sticky lg:top-[5.8rem]">
            <label className="relative block">
              <span className="sr-only">
                {t("Rechercher dans la FAQ", "Search the FAQ")}
              </span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Rechercher…", "Search…")}
                className="field pl-9 pr-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("Effacer la recherche", "Clear search")}
                  className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>

            <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible">
              {CATEGORIES.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-left text-[0.68rem] font-semibold transition lg:rounded-xl",
                      active
                        ? "bg-ink text-background"
                        : "text-ink/65 hover:bg-surface",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {locale === "ar" ? item.labelAr ?? item.labelFr : locale === "en" ? item.labelEn : item.labelFr}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 hidden rounded-2xl border border-line/80 bg-surface/50 p-4 lg:block">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-terracotta">
                {t("Besoin d’une réponse humaine", "Need a human answer")}
              </p>
              <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                {t(
                  "L’atelier répond directement sur WhatsApp, en français, anglais ou arabe.",
                  "The atelier replies directly on WhatsApp, in French, English or Arabic.",
                )}
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-terracotta"
              >
                {t("Écrire à l’atelier", "Message the atelier")}
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* Accordion */}
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-muted">
            {filtered.length}{" "}
            {filtered.length === 1
              ? t("question", "question")
              : t("questions", "questions")}
          </p>

          {filtered.length === 0 ? (
            <div className="mt-4 flex min-h-[18rem] flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-line bg-surface/30 px-6 text-center">
              <Search className="h-6 w-6 text-terracotta" />
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                {t("Aucune réponse trouvée.", "No answer found.")}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                {t(
                  "Reformulez votre recherche ou écrivez-nous directement.",
                  "Try different words or message us directly.",
                )}
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-5"
              >
                {t("Poser la question", "Ask the question")}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-line/70 border-y border-line/70">
              {filtered.map((entry) => {
                const open = openId === entry.id;
                return (
                  <div key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : entry.id)}
                      aria-expanded={open}
                      className="flex w-full items-start justify-between gap-4 py-4 text-left transition hover:text-terracotta"
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-[0.62rem] font-semibold text-muted">
                          {String(
                            FAQS.findIndex((item) => item.id === entry.id) + 1,
                          ).padStart(2, "0")}
                        </span>
                        <span className="text-[0.92rem] font-semibold leading-snug text-ink">
                          {locale === "ar" ? (entry.qAr ?? entry.qFr) : locale === "en" ? entry.qEn : entry.qFr}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform",
                          open && "rotate-180 text-terracotta",
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pl-8 pr-8 text-[0.86rem] leading-[1.75] text-muted">
                            {locale === "ar" ? (entry.aAr ?? entry.aFr) : locale === "en" ? entry.aEn : entry.aFr}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-line bg-gradient-to-br from-surface via-background to-surface p-7 shadow-soft sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-[0.56rem] font-bold uppercase tracking-[0.2em] text-gold">
                <Sparkles className="h-3 w-3" />
                {t("La question suivante", "The next question", "السؤال التالي")}
              </p>
              <p className="mt-1.5 font-serif text-2xl font-semibold text-ink">
                {t(
                  "Un projet précis ? Parlons-en.",
                  "A specific project? Let’s talk.",
                  "لديك مشروع محدد؟ لنتحدث.",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold"
              >
                WhatsApp
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </a>
              <Link
                href="/custom-order"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-terracotta hover:text-terracotta"
              >
                {t("Sur mesure", "Bespoke", "حسب الطلب")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
