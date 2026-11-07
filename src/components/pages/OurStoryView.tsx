"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  HeartHandshake,
  Leaf,
  MapPin,
  Mountain,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import type { StorefrontArtisan } from "@/lib/storefront";

interface OurStoryViewProps {
  artisans: StorefrontArtisan[];
}

const PROCESS = [
  {
    icon: MapPin,
    titleFr: "La visite",
    titleEn: "The visit",
    titleAr: "الزيارة",
    bodyFr:
      "Nous nous rendons dans le village, sans intermédiaire. Nous regardons les pièces en cours, les laines, les carnets de motifs. Rien n’est acheté sur photo.",
    bodyEn:
      "We travel to the village, with no middleman. We look at work in progress, the wools, the motif notebooks. Nothing is bought from a photograph.",
    bodyAr:
      "نذهب إلى القرية، دون وسيط. ننظر إلى القطع قيد النسج، إلى الصوف، إلى دفاتر النقوش. لا نشتري شيئاً من صورة.",
  },
  {
    icon: Scissors,
    titleFr: "Le choix de la laine",
    titleEn: "Choosing the wool",
    titleAr: "اختيار الصوف",
    bodyFr:
      "La laine vient des troupeaux voisins. Les teintures sont végétales ou soigneusement sélectionnées. Une pièce ne commence jamais avant que la matière soit juste.",
    bodyEn:
      "The wool comes from neighbouring flocks. Dyes are plant-based or carefully selected. A piece never begins before the material is right.",
    bodyAr:
      "يأتي الصوف من قطعان مجاورة. الأصباغ نباتية أو مختارة بعناية. لا تبدأ أي قطعة قبل أن تكون المادة صحيحة.",
  },
  {
    icon: Mountain,
    titleFr: "Le métier",
    titleEn: "The loom",
    titleAr: "النول",
    bodyFr:
      "Le tissage se fait à la main, sur un métier de bois, sans carton. C’est le geste qui décide, pas un plan industriel. Les pièces sont uniques par construction.",
    bodyEn:
      "Weaving is done by hand on a wooden loom, without a template. The gesture decides, not an industrial plan. Pieces are unique by construction.",
    bodyAr:
      "يتم النسج يدوياً على نول خشبي، دون قالب. الحركة هي التي تقرر، لا مخطط صناعي. القطع فريدة بحكم تكوينها.",
  },
  {
    icon: BadgeCheck,
    titleFr: "Le certificat",
    titleEn: "The certificate",
    titleAr: "الشهادة",
    bodyFr:
      "Chaque tapis est photographié, mesuré, numéroté et signé par l’artisane. Le certificat nominatif accompagne la pièce jusqu’à votre porte.",
    bodyEn:
      "Every rug is photographed, measured, numbered and signed by the artisan. The named certificate travels with the piece to your door.",
    bodyAr:
      "تُصوَّر كل زربية وتُقاس وتُرقَّم وتُوقّع من الحرفية. ترافق الشهادة الاسمية القطعة حتى بابك.",
  },
];

const VALUES = [
  {
    icon: HeartHandshake,
    titleFr: "Un prix juste, payé juste",
    titleEn: "A fair price, fairly paid",
    titleAr: "سعر عادل، يُدفع بعدل",
    bodyFr:
      "Nous publions nos prix et rémunérons l’atelier avant l’expédition. Pas de consignation, pas de paiement à la vente.",
    bodyEn:
      "We publish our prices and pay the atelier before shipping. No consignment, no payment-on-sale.",
    bodyAr:
      "ننشر أسعارنا وندفع للورشة قبل الشحن. لا أمانة، ولا دفع عند البيع.",
  },
  {
    icon: Leaf,
    titleFr: "La matière avant tout",
    titleEn: "Material first",
    titleAr: "المادة أولاً",
    bodyFr:
      "Laine de mouton, coton naturel, teintures végétales quand c’est possible. Nous refusons les fibres synthétiques dans les pièces anciennes.",
    bodyEn:
      "Sheep wool, natural cotton, plant dyes where possible. We refuse synthetic fibres in heritage pieces.",
    bodyAr:
      "صوف خروف، قطن طبيعي، وأصباغ نباتية حين يكون ذلك ممكناً. نرفض الألياف الاصطناعية في القطع التراثية.",
  },
  {
    icon: Users,
    titleFr: "Des noms, pas des fournisseurs",
    titleEn: "Names, not suppliers",
    titleAr: "أسماء، لا موردون",
    bodyFr:
      "Chaque pièce porte le nom de son artisane et de son village. La transparence n’est pas un argument marketing, c’est la structure même du catalogue.",
    bodyEn:
      "Every piece carries its artisan’s name and village. Transparency is not a marketing line; it is the structure of the catalogue.",
    bodyAr:
      "كل قطعة تحمل اسم حرفيتها وقريةها. الشفافية ليست حجة تسويقية، بل هي بنية الكتالوج نفسه.",
  },
];

export function OurStoryView({ artisans }: OurStoryViewProps) {
  const { locale, t } = useStore();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-surface/35">
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-50" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20 lg:py-24">
          <nav
            aria-label={t("Fil d’Ariane", "Breadcrumb", "مسار التنقل")}
            className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="transition hover:text-terracotta">
              {t("Accueil", "Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="text-ink/65">{t("Notre histoire", "Our story", "قصتنا")}</span>
          </nav>

          <div className="mt-8 grid gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <p className="eyebrow-line">
                {t("Depuis Aït Bouguemez", "From Aït Bouguemez", "من آيت بوكماز")}
              </p>
              <h1 className="mt-4 max-w-2xl text-balance font-serif text-[3rem] font-semibold leading-[0.95] tracking-[-0.04em] sm:text-[4.2rem]">
                {t(
                  "Nous n’avons pas inventé les tapis. Nous les avons écoutés.",
                  "We did not invent the rugs. We listened to them.",
                  "لم نبتكر الزرابي. بل أصغينا إليها.",
                )}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-[0.95rem] leading-[1.75] text-muted">
                {t(
                  "Zarbia Atlas est né d’un constat simple : les plus belles pièces du Moyen Atlas quittaient les villages sans nom, sans histoire et sans prix juste. Nous avons décidé de changer le trajet, pas la matière.",
                  "Zarbia Atlas began with a simple observation: the finest pieces from the Middle Atlas left the villages without a name, a story or a fair price. We decided to change the route, not the material.",
                  "وُلدت زربية أطلس من ملاحظة بسيطة: أجمل قطع الأطلس المتوسط كانت تغادر القرى بلا اسم، بلا حكاية وبلا سعر عادل. قررنا تغيير الطريق، لا المادة.",
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-primary">
                  {t("Découvrir les pièces", "Discover the pieces", "اكتشف القطع")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/custom-order" className="btn-ghost">
                  {t("Commander sur mesure", "Commission bespoke", "اطلب حسب المقاس")}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-wool">
                <Image
                  src={
                    artisans[0]?.photoUrl ??
                    "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={t(
                    "Artisane tissant sur un métier traditionnel",
                    "Artisan weaving on a traditional loom",
                  )}
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-ink/55 p-4 text-background backdrop-blur">
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.2em] text-gold">
                    {t("Atelier partenaire", "Partner atelier")}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">
                    {artisans[0]
                      ? locale === "ar"
                        ? artisans[0].nameFr
                        : locale === "en"
                          ? artisans[0].nameEn
                          : artisans[0].nameFr
                      : "Aït Bouguemez"}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-background/65">
                    {artisans[0]
                      ? `${artisans[0].village} · ${artisans[0].region}`
                      : "Moyen Atlas, Maroc"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-line/80 pt-6 sm:grid-cols-4">
            {[
              ["3", t("villages partenaires", "partner villages")],
              ["5", t("traditions tissées", "woven traditions")],
              ["100 %", t("laine naturelle", "natural wool")],
              ["0", t("intermédiaire", "middleman")],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-serif text-3xl font-semibold text-ink">
                  {value}
                </dt>
                <dd className="mt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Manifesto */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow-line">{t("Notre manifeste", "Our manifesto", "بياننا")}</p>
            <h2 className="mt-2 text-balance font-serif text-4xl font-semibold leading-[1.03] sm:text-5xl">
              {t(
                "Un tapis n’est pas un produit. C’est un temps de vie.",
                "A rug is not a product. It is a span of a life.",
              )}
            </h2>
          </div>
          <div className="space-y-4 text-pretty text-[0.92rem] leading-[1.8] text-ink/75">
            <p>
              {t(
                "Un Beni Ourain de 250 × 350 cm représente plusieurs mois de gestes répétés, souvent par une seule femme, dans une pièce où le métier occupe la moitié de l’espace. Ce temps ne se compresse pas. Il ne se négocie pas non plus à la baisse sans toucher la laine, la densité ou la rémunération.",
                "A 250 × 350 cm Beni Ourain represents months of repeated gestures, often by one woman, in a room where the loom takes up half the space. That time cannot be compressed. Nor can it be negotiated down without touching the wool, the density or the pay.",
              )}
            </p>
            <p>
              {t(
                "Notre travail consiste à rendre ce temps visible et à le payer correctement. Nous visitons les ateliers, choisissons les pièces sur place, publions les noms et les villages. Nous refusons les pièces retouchées, les teintures qui ne tiennent pas et les récits inventés.",
                "Our work is to make that time visible and to pay for it properly. We visit the ateliers, choose pieces on site, publish names and villages. We refuse doctored pieces, dyes that do not hold and invented stories.",
              )}
            </p>
            <p className="border-l-2 border-gold pl-4 font-serif text-xl italic leading-relaxed text-ink/80">
              {t(
                "« Une pièce juste ne se reconnaît pas à son prix. Elle se reconnaît au fait qu’on la garde trente ans. »",
                "“A right piece is not recognised by its price. It is recognised by the fact that you keep it for thirty years.”",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-line/70 bg-surface/35">
        <div className="container-page py-14 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow-line">{t("Du village à votre porte", "From village to door", "من القرية إلى بابك")}</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">
                {t("Notre méthode, en quatre temps.", "Our method, in four steps.")}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t(
                "Aucune étape n’est sous-traitée à un intermédiaire. Le trajet est plus long ; c’est ce qui le rend lisible.",
                "No step is outsourced to a middleman. The route is longer; that is what makes it legible.",
              )}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, index) => (
              <article
                key={step.titleFr}
                className="rounded-[1.4rem] border border-line/80 bg-background p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-terracotta">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[0.7rem] font-semibold text-muted">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3.5 font-serif text-xl font-semibold">
                  {locale === "ar" ? step.titleAr : locale === "en" ? step.titleEn : step.titleFr}
                </h3>
                <p className="mt-1.5 text-[0.76rem] leading-relaxed text-muted">
                  {locale === "ar" ? step.bodyAr : locale === "en" ? step.bodyEn : step.bodyFr}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Artisans */}
      <section className="container-page py-14 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow-line">{t("Les mains", "The hands", "الأيادي")}</p>
          <h2 className="mt-2 text-balance font-serif text-4xl font-semibold sm:text-5xl">
            {t(
              "Celles qui nouent, celles qui signent.",
              "The ones who knot, the ones who sign.",
            )}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t(
              "Chaque pièce du catalogue est rattachée à une artisane identifiée. Voici les ateliers avec lesquels nous travaillons cette saison.",
              "Every piece in the catalogue is linked to a named artisan. These are the ateliers we work with this season.",
            )}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((artisan) => (
            <article
              key={artisan.id}
              className="group overflow-hidden rounded-[1.6rem] border border-line/80 bg-background"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-wool">
                {artisan.photoUrl ? (
                  <Image
                    src={artisan.photoUrl}
                    alt={locale === "ar" ? artisan.nameFr : locale === "en" ? artisan.nameEn : artisan.nameFr}
                    fill
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-serif text-2xl font-semibold text-background">
                    {locale === "ar" ? artisan.nameFr : locale === "en" ? artisan.nameEn : artisan.nameFr}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.64rem] text-background/70">
                    <MapPin className="h-3 w-3" />
                    {artisan.village} · {artisan.region}
                  </p>
                </div>
              </div>
              <div className="p-5">
                {artisan.craftSince ? (
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-terracotta">
                    {t("Métier depuis", "Crafting since")} {artisan.craftSince}
                  </p>
                ) : null}
                <p className="mt-2 text-[0.78rem] leading-relaxed text-muted">
                  {locale === "ar" ? artisan.bioFr : locale === "en" ? artisan.bioEn : artisan.bioFr}
                </p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-terracotta"
                >
                  {t("Voir ses pièces", "See their pieces")}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-line/70 bg-surface/35">
        <div className="container-page py-20 sm:py-28">
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map((value) => (
              <article
                key={value.titleFr}
                className="rounded-[1.4rem] border border-line/80 bg-background p-5 transition duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-card"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-terracotta">
                  <value.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3.5 font-serif text-xl font-semibold">
                  {locale === "ar" ? value.titleAr : locale === "en" ? value.titleEn : value.titleFr}
                </h3>
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-muted">
                  {locale === "ar" ? value.bodyAr : locale === "en" ? value.bodyEn : value.bodyFr}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-surface via-background to-surface p-8 shadow-soft sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-zellige opacity-15" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-terracotta">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Venir à l’atelier", "Visit the atelier", "زيارة الورشة")}
              </p>
              <h2 className="mt-3 max-w-lg text-balance font-serif text-3xl font-semibold text-ink sm:text-4xl">
                {t(
                  "Nous recevons à Aït Bouguemez, sur rendez-vous.",
                  "We welcome visitors in Aït Bouguemez, by appointment.",
                  "نستقبلكم في آيت بوكماز، بموعد مسبق.",
                )}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {t(
                  "Un thé, les métiers en cours, et le temps de choisir sans pression.",
                  "Tea, work in progress on the looms, and time to choose without pressure.",
                  "شاي، أنوال قيد العمل، والوقت للاختيار دون ضغط.",
                )}
              </p>
            </div>
            <Link
              href="/custom-order"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-terracottaDark hover:shadow-soft"
            >
              {t("Parler de votre projet", "Discuss your project", "تحدّث عن مشروعك")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
