import type { SerializedRug } from "@/lib/api/serializers";
import type { CurrencyCode } from "@/lib/money";

/**
 * Fallback catalogue.
 *
 * The storefront renders live PostgreSQL data; these eight pieces exist so the
 * client store always has a complete, typed catalogue to work with before
 * `/api/rugs` responds (or when the database is unreachable during a demo).
 * SKUs, names, prices, artisan names and stories mirror `prisma/seed.ts`, so
 * replacing the fallback with the API response is invisible to the shopper.
 */

export type InitialRugType =
  | "BENI_OURAIN"
  | "AZILAL"
  | "BOUCHEROUITE"
  | "KILIM"
  | "HANBEL";

export type InitialRugStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface InitialRug {
  id: string;
  slug: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  type: InitialRugType;
  widthCm: number;
  lengthCm: number;
  weightKg: number;
  materialFr: string;
  materialAr: string;
  /** One of "Middle Atlas", "High Atlas" or "Haouz". */
  originRegion: string;
  originAr: string;
  artisanName: string;
  storyFr: string;
  storyAr: string;
  priceMad: number;
  status: InitialRugStatus;
  isMadeToOrder: boolean;
  /** Four high-resolution photographs, first one is the cover. */
  photos: string[];
  certificateId: string;

  /* Optional enrichment used to build a complete storefront record. */
  materialEn?: string;
  storyEn?: string;
  originVillage?: string;
  craftingDays?: number;
  viewCount?: number;
  reservedUntil?: string | null;
  createdAt?: string;
}

/** Units of currency obtained for 1 MAD. Kept in sync with the seed. */
export const MOCK_RATES: Record<CurrencyCode, number> = {
  MAD: 1,
  EUR: 0.096,
  USD: 0.105,
};

const unsplash = (id: string, width = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * A deterministic reservation deadline keeps the fallback catalogue identical
 * on the server and in the browser (no `Date.now()` during render).
 */
const FALLBACK_RESERVATION = "2027-12-31T23:59:59.000Z";

export const INITIAL_RUGS: InitialRug[] = [
  {
    id: "rug-atlas-neige",
    slug: "atlas-neige-beni-ourain",
    sku: "ZA-BO-001",
    nameFr: "Atlas Neige",
    nameEn: "Atlas Snow",
    nameAr: "ثلج الأطلس",
    type: "BENI_OURAIN",
    widthCm: 200,
    lengthCm: 300,
    weightKg: 12.5,
    materialFr: "Laine de mouton non teintée des Aït Bouguemez",
    materialAr: "صوف خروف غير مصبوغ من آيت بوكماز",
    materialEn: "Undyed sheep wool from the Aït Bouguemez flocks",
    originVillage: "Aït Bouguemez",
    originRegion: "Middle Atlas",
    originAr: "الأطلس المتوسط",
    artisanName: "Fatima Ait Bouzid",
    storyFr:
      "Un Beni Ourain de salon, tissé en laine vierge sur un métier vertical. Les lignes de losanges noirs racontent, dit-on, la carte des chemins de transhumance entre les villages du plateau. La laine haute et dense garde la chaleur en hiver et respire en été.",
    storyAr:
      "سجادة بنى وارين لغرفة المعيشة، منسوجة من صوف خام على نول عمودي. تروي خطوط المعينات السوداء، كما يُقال، خريطة طرق الترحال بين قرى الهضبة. الوبرة العالية والكثيفة تُبقي الدفء في الشتاء وتتنفس في الصيف.",
    storyEn:
      "A living-room Beni Ourain, woven in virgin wool on an upright loom. Its lines of black diamonds are said to map the transhumance paths between the plateau villages. The deep, dense pile holds warmth in winter and breathes in summer.",
    priceMad: 4200,
    status: "AVAILABLE",
    isMadeToOrder: false,
    photos: [
      unsplash("photo-1600166898405-da9535204843"),
      unsplash("photo-1584100936595-c0654b55a2e2"),
      unsplash("photo-1600585154340-be6161a56a0c"),
      unsplash("photo-1615529182904-14819c35db37"),
    ],
    certificateId: "ZA-CERT-2026-0001",
    craftingDays: 62,
    viewCount: 412,
    createdAt: "2026-01-08T10:00:00.000Z",
  },
  {
    id: "rug-lune-berbere",
    slug: "lune-berbere-beni-ourain",
    sku: "ZA-BO-002",
    nameFr: "Lune Berbère",
    nameEn: "Berber Moon",
    nameAr: "قمر أمازيغي",
    type: "BENI_OURAIN",
    widthCm: 150,
    lengthCm: 250,
    weightKg: 8.2,
    materialFr: "Laine de mouton non teintée, coton naturel",
    materialAr: "صوف خروف غير مصبوغ، قطن طبيعي",
    materialEn: "Undyed sheep wool with a natural cotton warp",
    originVillage: "Aït Bouguemez",
    originRegion: "Middle Atlas",
    originAr: "الأطلس المتوسط",
    artisanName: "Fatima Ait Bouzid",
    storyFr:
      "Une pièce de format couloir ou chambre, au dessin plus aéré que celui des grands Beni Ourain. Les frises latérales reprennent le motif de la lune, protecteur du foyer dans la tradition berbère. La trame en coton naturel lui donne une souplesse immédiate.",
    storyAr:
      "قطعة بحجم الممر أو غرفة النوم، بتصميم أكثر انفتاحاً من بنى وارين الكبيرة. تستعيد الإطارات الجانبية motif القمر، حامي المنزل في التقاليد الأمازيغية. تمنحها السداة القطنية الطبيعية مرونة فورية.",
    storyEn:
      "A runner-sized piece for a hallway or bedroom, with a more open drawing than the large Beni Ourains. The side borders repeat the moon motif, a protector of the home in Berber tradition. The natural cotton warp makes it supple from the first day.",
    priceMad: 3200,
    status: "RESERVED",
    isMadeToOrder: false,
    photos: [
      unsplash("photo-1615529182904-14819c35db37"),
      unsplash("photo-1600210492486-724fe5c67fb0"),
      unsplash("photo-1618221195710-dd6b41faaea6"),
      unsplash("photo-1600607687920-4e2a09cf159d"),
    ],
    certificateId: "ZA-CERT-2026-0002",
    craftingDays: 48,
    viewCount: 356,
    reservedUntil: FALLBACK_RESERVATION,
    createdAt: "2026-01-19T10:00:00.000Z",
  },
  {
    id: "rug-jardin-azilal",
    slug: "jardin-azilal",
    sku: "ZA-AZ-001",
    nameFr: "Jardin d'Azilal",
    nameEn: "Azilal Garden",
    nameAr: "حديقة أزيلال",
    type: "AZILAL",
    widthCm: 160,
    lengthCm: 240,
    weightKg: 7.8,
    materialFr: "Laine de mouton teinte à la main, coton",
    materialAr: "صوف خروف مصبوغ يدوياً، قطن",
    materialEn: "Hand-dyed sheep wool with a cotton warp",
    originVillage: "Demnate",
    originRegion: "Middle Atlas",
    originAr: "الأطلس المتوسط",
    artisanName: "Fatima Ait Bouzid",
    storyFr:
      "Les Azilal se reconnaissent à leurs aplats de couleur libre, sans dessin préalable. Ici, l'indigo, le safran et la garance dessinent un jardin abstrait : chaque tisseuse y sème ses propres fleurs. Une pièce unique, signée au dos.",
    storyAr:
      "تُعرف سجاد أزيلال بمساحات لونها الحرة، دون رسم مسبق. هنا، النيلي والزعفران والقرمز ترسم حديقة تجريدية: كل نسّاجة تزرع أزهارها الخاصة. قطعة فريدة، موقّعة على الظهر.",
    storyEn:
      "Azilal rugs are recognised by their free blocks of colour, woven without a prior drawing. Here indigo, saffron and madder form an abstract garden: every weaver plants her own flowers. A one-of-a-kind piece, signed on the reverse.",
    priceMad: 3500,
    status: "AVAILABLE",
    isMadeToOrder: false,
    photos: [
      unsplash("photo-1616486338812-3dadae4b4ace"),
      unsplash("photo-1600607687920-4e2a09cf159d"),
      unsplash("photo-1600566753086-00f18fb6b3ea"),
      unsplash("photo-1493663284031-b7e3aefcae8e"),
    ],
    certificateId: "ZA-CERT-2026-0003",
    craftingDays: 48,
    viewCount: 289,
    createdAt: "2026-02-02T10:00:00.000Z",
  },
  {
    id: "rug-sentier-atlas",
    slug: "sentier-de-l-atlas-azilal",
    sku: "ZA-AZ-002",
    nameFr: "Sentier de l'Atlas",
    nameEn: "Atlas Path",
    nameAr: "طريق الأطلس",
    type: "AZILAL",
    widthCm: 85,
    lengthCm: 300,
    weightKg: 6.4,
    materialFr: "Laine de mouton teinte à la main",
    materialAr: "صوف خروف مصبوغ يدوياً",
    materialEn: "Hand-dyed sheep wool",
    originVillage: "Demnate",
    originRegion: "Middle Atlas",
    originAr: "الأطلس المتوسط",
    artisanName: "Fatima Ait Bouzid",
    storyFr:
      "Un couloir tissé comme un chemin de montagne : bandes de safran et d'écru, ponctuées de losanges grenat. Le format étroit était traditionnellement posé le long des murs de terre des maisons du Doukkala. Il structure aujourd'hui les entrées contemporaines.",
    storyAr:
      "ممر منسوج كطريق جبلي: شرائط من الزعفران والبيج مقطوعة بمعينات عنابية. كان هذا الشكل الضيق يُوضع تقليدياً على طول جدران التراب في منازل دكالة. وهو يُهيكل اليوم المداخل المعاصرة.",
    storyEn:
      "A runner woven like a mountain path: bands of saffron and ecru punctuated by garnet diamonds. This narrow format was traditionally laid along the earthen walls of Doukkala houses; today it frames contemporary entryways.",
    priceMad: 2900,
    status: "AVAILABLE",
    isMadeToOrder: true,
    photos: [
      unsplash("photo-1600573472592-401b489a3cdc"),
      unsplash("photo-1524758631624-e2822e304c36"),
      unsplash("photo-1493663284031-b7e3aefcae8e"),
      unsplash("photo-1594026112284-02bb6f3352fe"),
    ],
    certificateId: "ZA-CERT-2026-0004",
    craftingDays: 40,
    viewCount: 198,
    createdAt: "2026-02-14T10:00:00.000Z",
  },
  {
    id: "rug-confettis-chichaoua",
    slug: "confettis-de-chichaoua",
    sku: "ZA-BQ-001",
    nameFr: "Confettis de Chichaoua",
    nameEn: "Chichaoua Confetti",
    nameAr: "أزهار شيشاوة",
    type: "BOUCHEROUITE",
    widthCm: 120,
    lengthCm: 180,
    weightKg: 4.2,
    materialFr: "Textiles recyclés, coton et fibres mixtes",
    materialAr: "منسوجات معاد تدويرها، قطن وألياف مختلطة",
    materialEn: "Recycled textiles, cotton and mixed fibres",
    originVillage: "Chichaoua",
    originRegion: "Haouz",
    originAr: "الحوز",
    artisanName: "Aïcha El Moudden",
    storyFr:
      "Le boucherouite est né de la nécessité : là où la laine manquait, les femmes ont tissé les chutes de vêtements. Ce tapis d'appoint réunit coton, acrylique et vieux draps dans une explosion de rose, de turquoise et de jaune. Chaque lavage intensifie ses couleurs.",
    storyAr:
      "وُلد بوشرويط من الضرورة: حيث ندرت الصوف، نسجت النساء بقايا الملابس. تجمع هذه السجادة الصغيرة القطن والأكريليك والملاءات القديمة في انفجار من الوردي والفيروزي والأصفر. كل غسلة تُعمّق ألوانها.",
    storyEn:
      "Boucherouite was born of necessity: where wool was scarce, women wove clothing scraps instead. This small rug brings together cotton, acrylic and old sheets in an explosion of pink, turquoise and yellow. Every wash deepens its colours.",
    priceMad: 1850,
    status: "AVAILABLE",
    isMadeToOrder: false,
    photos: [
      unsplash("photo-1555041469-a586c61ea9bc"),
      unsplash("photo-1519710164239-da123dc03ef4"),
      unsplash("photo-1567016432779-094069958ea5"),
      unsplash("photo-1598300056393-4aac492f4344"),
    ],
    certificateId: "ZA-CERT-2026-0005",
    craftingDays: 22,
    viewCount: 244,
    createdAt: "2026-03-03T10:00:00.000Z",
  },
  {
    id: "rug-roseraie-haouz",
    slug: "roseraie-de-haouz",
    sku: "ZA-BQ-002",
    nameFr: "Roseraie du Haouz",
    nameEn: "Haouz Rose Garden",
    nameAr: "حديقة ورود الحوز",
    type: "BOUCHEROUITE",
    widthCm: 150,
    lengthCm: 210,
    weightKg: 5.6,
    materialFr: "Coton recyclé, laine résiduelle",
    materialAr: "قطن معاد تدويره، صوف متبقي",
    materialEn: "Recycled cotton with residual wool",
    originVillage: "Chichaoua",
    originRegion: "Haouz",
    originAr: "الحوز",
    artisanName: "Aïcha El Moudden",
    storyFr:
      "Inspirée des roseraies qui bordent l'oued Tensift, cette pièce marie rose poudré, ivoire et rouge profond. Les irrégularités de trame sont volontaires : elles rappellent que le tapis a été noué à la main, sans gabarit, sur plusieurs semaines.",
    storyAr:
      "مستوحاة من ورود وادي تنسيفت، تجمع هذه القطعة الوردي البودرة والعاج والأحمر العميق. تعمّد عدم انتظام النسيج: لتذكير بأن السجادة نُسجت يدوياً، دون قالب، على مدى أسابيع.",
    storyEn:
      "Inspired by the rose fields along the Tensift river, this piece pairs powder pink, ivory and deep red. The irregularities in the weft are deliberate: they remind you the rug was knotted by hand, without a template, over several weeks.",
    priceMad: 2350,
    status: "AVAILABLE",
    isMadeToOrder: true,
    photos: [
      unsplash("photo-1600210491892-03d54c0aaf87"),
      unsplash("photo-1615873968403-89e068629265"),
      unsplash("photo-1550226891-ef816aed4a98"),
      unsplash("photo-1524758631624-e2822e304c36"),
    ],
    certificateId: "ZA-CERT-2026-0006",
    craftingDays: 28,
    viewCount: 167,
    createdAt: "2026-03-17T10:00:00.000Z",
  },
  {
    id: "rug-ocre-tahannaout",
    slug: "ocre-de-tahannaout-kilim",
    sku: "ZA-KL-001",
    nameFr: "Ocre de Tahannaout",
    nameEn: "Tahannaout Ochre",
    nameAr: "أُكْر تاحناوت",
    type: "KILIM",
    widthCm: 170,
    lengthCm: 260,
    weightKg: 6.8,
    materialFr: "Laine teinte à la garance et à l'écorce de grenade",
    materialAr: "صوف مصبوغ بجذور الفوة وقشر الرمان",
    materialEn: "Wool dyed with madder root and pomegranate peel",
    originVillage: "Tahannaout",
    originRegion: "High Atlas",
    originAr: "الأطلس الكبير",
    artisanName: "Khadija Ait Oussaden",
    storyFr:
      "Un kilim tissé à plat, sans velours, dont la trame est serrée au peigne. L'ocre dominant provient de la garance cultivée dans la vallée ; le noir profond, de l'écorce de grenade. Les motifs de peignes et de losanges ouverts rappellent les tapisseries des Aït Oussaden.",
    storyAr:
      "كليم منسوج على نحو مسطح، دون وبرة، سداة مشدودة بالمشط. الأصفر السائد من الفوة المزروعة في الوادي؛ الأسود العميق من قشر الرمان. motifs المشط والمعينات المفتوحة تذكر بسجاد آيت أوسادن.",
    storyEn:
      "A flat-woven kilim with no pile, its weft beaten tight with a comb. The dominant ochre comes from madder grown in the valley; the deep black from pomegranate peel. Combs and open diamonds echo the tapestries of the Aït Oussaden.",
    priceMad: 3800,
    status: "AVAILABLE",
    isMadeToOrder: false,
    photos: [
      unsplash("photo-1584100936595-c0654b55a2e2"),
      unsplash("photo-1600166898405-da9535204843"),
      unsplash("photo-1594026112284-02bb6f3352fe"),
      unsplash("photo-1600585154340-be6161a56a0c"),
    ],
    certificateId: "ZA-CERT-2026-0007",
    craftingDays: 55,
    viewCount: 322,
    createdAt: "2026-04-05T10:00:00.000Z",
  },
  {
    id: "rug-nuit-ourika",
    slug: "nuit-de-l-ourika-hanbel",
    sku: "ZA-HB-001",
    nameFr: "Nuit de l'Ourika",
    nameEn: "Ourika Night",
    nameAr: "ليلة أوريكا",
    type: "HANBEL",
    widthCm: 160,
    lengthCm: 280,
    weightKg: 9.1,
    materialFr: "Laine recyclée, coton",
    materialAr: "صوف معاد تدويره، قطن",
    materialEn: "Recycled wool with cotton",
    originVillage: "Tahannaout",
    originRegion: "High Atlas",
    originAr: "الأطلس الكبير",
    artisanName: "Khadija Ait Oussaden",
    storyFr:
      "Le hanbel est le tapis de vie des maisons du Haut Atlas : tissé à plat, réversible, assez robuste pour la terre battue comme pour le salon. Celui-ci associe bandes indigo et écru, avec une bordure de motifs protecteurs. Il se retourne au fil des saisons.",
    storyAr:
      "الحنبل هو سجادة حياة منازل الأطلس الكبير: منسوج على نحو مسطح، قابل للقلب، متين enough لالأرض المدكوكة كما لغرفة المعيشة. تجمع هذه القطعة شرائط نيلي وبيج، مع حدود motifs واقية. يُقلب مع تعاقب الفصول.",
    storyEn:
      "The hanbel is the everyday rug of High Atlas homes: flat-woven, reversible, sturdy enough for packed earth or a modern living room. This one pairs indigo and ecru bands with a border of protective motifs, and can be turned with the seasons.",
    priceMad: 3050,
    status: "AVAILABLE",
    isMadeToOrder: true,
    photos: [
      unsplash("photo-1618221195710-dd6b41faaea6"),
      unsplash("photo-1616486338812-3dadae4b4ace"),
      unsplash("photo-1598300056393-4aac492f4344"),
      unsplash("photo-1615529182904-14819c35db37"),
    ],
    certificateId: "ZA-CERT-2026-0008",
    craftingDays: 44,
    viewCount: 275,
    createdAt: "2026-04-21T10:00:00.000Z",
  },
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Convert a fallback record into the exact JSON shape returned by
 * `serializeRug()` so every storefront component can consume it unchanged.
 */
export function toStoreRug(rug: InitialRug): SerializedRug {
  const createdAt = rug.createdAt ?? "2026-01-01T10:00:00.000Z";
  const sold = rug.status === "SOLD";

  return {
    id: rug.id,
    slug: rug.slug,
    sku: rug.sku,
    nameFr: rug.nameFr,
    nameEn: rug.nameEn,
    nameAr: rug.nameAr ?? null,
    type: rug.type,
    widthCm: rug.widthCm,
    lengthCm: rug.lengthCm,
    weightKg: rug.weightKg,
    materialFr: rug.materialFr,
    materialEn: rug.materialEn ?? rug.materialFr,
    materialAr: rug.materialAr ?? null,
    originVillage: rug.originVillage ?? rug.originRegion,
    originRegion: rug.originRegion,
    originAr: rug.originAr ?? null,
    craftingDays: rug.craftingDays ?? 45,
    storyFr: rug.storyFr,
    storyEn: rug.storyEn ?? rug.storyFr,
    storyAr: rug.storyAr ?? null,
    priceMad: rug.priceMad,
    priceEur: roundMoney(rug.priceMad * MOCK_RATES.EUR),
    priceUsd: roundMoney(rug.priceMad * MOCK_RATES.USD),
    stock: sold ? 0 : 1,
    status: rug.status,
    reservedUntil:
      rug.status === "RESERVED"
        ? (rug.reservedUntil ?? FALLBACK_RESERVATION)
        : null,
    viewCount: rug.viewCount ?? 0,
    isMadeToOrder: rug.isMadeToOrder,
    photos: rug.photos,
    videoUrl: null,
    certificateId: rug.certificateId,
    artisanId: `artisan-${slugify(rug.artisanName)}`,
    createdAt,
    updatedAt: createdAt,
    artisan: null,
  };
}

/** Catalogue ready for `useState`, in the same shape as `/api/rugs`. */
export const INITIAL_STORE_RUGS: SerializedRug[] = INITIAL_RUGS.map(toStoreRug);

export const INITIAL_ARTISANS = [
  {
    id: "artisan-fatima-ait-bouzid",
    slug: "fatima-ait-bouzid",
    nameFr: "Fatima Ait Bouzid",
    nameEn: "Fatima Ait Bouzid",
    bioFr:
      "Née à Aït Bouguemez, dans le Moyen Atlas, Fatima tisse depuis l'âge de quatorze ans. Elle perpétue les motifs en losange des Beni Ourain, transmis par sa grand-mère, et signe aujourd'hui des pièces en laine vierge pour des collectionneurs du monde entier.",
    bioEn:
      "Born in Aït Bouguemez in the Middle Atlas, Fatima has been weaving since she was fourteen. She keeps alive the diamond motifs of the Beni Ourain, handed down by her grandmother, and now creates undyed wool pieces for collectors around the world.",
    village: "Aït Bouguemez",
    region: "Moyen Atlas — Province d'Azilal",
    photoUrl:
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=1200&q=80",
    craftSince: 1987,
  },
  {
    id: "artisan-khadija-ait-oussaden",
    slug: "khadija-ait-oussaden",
    nameFr: "Khadija Ait Oussaden",
    nameEn: "Khadija Ait Oussaden",
    bioFr:
      "Installée à Tahannaout, au pied du Haut Atlas, Khadija est spécialiste du kilim et du hanbel. Elle teint elle-même ses laines avec des écorces de grenade et de la garance, puis compose des trames géométriques inspirées des tapis de la vallée de l'Ourika.",
    bioEn:
      "Based in Tahannaout at the foot of the High Atlas, Khadija specialises in kilim and hanbel flatweaves. She dyes her own wool with pomegranate peel and madder root, then composes geometric patterns inspired by the rugs of the Ourika valley.",
    village: "Tahannaout",
    region: "Haut Atlas — Al Haouz",
    photoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1200&q=80",
    craftSince: 1994,
  },
  {
    id: "artisan-aicha-el-moudden",
    slug: "aicha-el-moudden",
    nameFr: "Aïcha El Moudden",
    nameEn: "Aicha El Moudden",
    bioFr:
      "Dans la plaine du Haouz, près de Chichaoua, Aïcha transforme chutes de tissus et fibres recyclées en boucherouites éclatantes. Son atelier réunit huit tisserandes et reverse une part de chaque vente à l'école du village.",
    bioEn:
      "In the Haouz plain near Chichaoua, Aïcha transforms fabric scraps and recycled fibres into vibrant boucherouite rugs. Her workshop brings together eight weavers and donates part of every sale to the local village school.",
    village: "Chichaoua",
    region: "Plaine du Haouz",
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    craftSince: 2005,
  },
];

export function getInitialRug(id: string): InitialRug | undefined {
  return INITIAL_RUGS.find((rug) => rug.id === id);
}

export function getInitialRugBySlug(slug: string): InitialRug | undefined {
  return INITIAL_RUGS.find((rug) => rug.slug === slug);
}

export function getInitialRugBySku(sku: string): InitialRug | undefined {
  return INITIAL_RUGS.find((rug) => rug.sku === sku);
}

export function getInitialRugsByType(
  type: InitialRugType,
): InitialRug[] {
  return INITIAL_RUGS.filter((rug) => rug.type === type);
}
