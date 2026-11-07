/**
 * Zarbia Atlas — database seed
 * ---------------------------------------------------------------------------
 * Idempotent: every record is upserted, so `npm run db:seed` can be run
 * repeatedly against the same database without creating duplicates.
 *
 * Usage:
 *   docker compose up -d
 *   npx prisma migrate dev --name init
 *   npm run db:seed
 */

import { PrismaClient, Prisma, RugType, RugStatus, Currency, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/admin/crypto";

const prisma = new PrismaClient();

// Base exchange rates: units of currency obtained for 1 MAD.
const EUR_RATE = 0.096;
const USD_RATE = 0.105;

// Development administrator. Override every value in `.env` before deploying.
const DEFAULT_ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

const money = (value: number) => Math.round(value * 100) / 100;
const toEur = (mad: number) => money(mad * EUR_RATE);
const toUsd = (mad: number) => money(mad * USD_RATE);
const decimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

// ---------------------------------------------------------------------------
// Currency rates
// ---------------------------------------------------------------------------

const currencyRates = [
  { currency: Currency.MAD, rate: 1, source: "peg" },
  { currency: Currency.EUR, rate: EUR_RATE, source: "seed" },
  { currency: Currency.USD, rate: USD_RATE, source: "seed" },
];

// ---------------------------------------------------------------------------
// Shipping rates, per zone and weight bracket (billed in MAD, converted)
// ---------------------------------------------------------------------------

type ShippingBracket = { min: number; max: number; mad: number };

const shippingZones: Array<{
  zone: string;
  carrier: string;
  days: [number, number];
  brackets: ShippingBracket[];
}> = [
  {
    zone: "MOROCCO",
    carrier: "Amana / CTM",
    days: [1, 3],
    brackets: [
      { min: 0, max: 2, mad: 45 },
      { min: 2, max: 5, mad: 65 },
      { min: 5, max: 10, mad: 90 },
      { min: 10, max: 20, mad: 120 },
      { min: 20, max: 30, mad: 160 },
    ],
  },
  {
    zone: "EUROPE",
    carrier: "DHL Express",
    days: [4, 7],
    brackets: [
      { min: 0, max: 2, mad: 280 },
      { min: 2, max: 5, mad: 380 },
      { min: 5, max: 10, mad: 520 },
      { min: 10, max: 20, mad: 690 },
      { min: 20, max: 30, mad: 890 },
    ],
  },
  {
    zone: "USA_CANADA",
    carrier: "DHL Express",
    days: [6, 10],
    brackets: [
      { min: 0, max: 2, mad: 420 },
      { min: 2, max: 5, mad: 560 },
      { min: 5, max: 10, mad: 740 },
      { min: 10, max: 20, mad: 980 },
      { min: 20, max: 30, mad: 1250 },
    ],
  },
  {
    zone: "MIDDLE_EAST",
    carrier: "Aramex",
    days: [5, 9],
    brackets: [
      { min: 0, max: 2, mad: 360 },
      { min: 2, max: 5, mad: 480 },
      { min: 5, max: 10, mad: 640 },
      { min: 10, max: 20, mad: 850 },
      { min: 20, max: 30, mad: 1100 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Artisans
// ---------------------------------------------------------------------------

const artisans = [
  {
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
    slug: "aicha-el-moudden",
    nameFr: "Aïcha El Moudden",
    nameEn: "Aicha El Moudden",
    bioFr:
      "Dans la plaine du Haouz, près de Chichaoua, Aïcha transforme chutes de tissus et fibres recyclées en boucherouites éclatantes. Son atelier réunit huit tisserandes et reverse une part de chaque vente à l'école du village.",
    bioEn:
      "On the Haouz plain near Chichaoua, Aicha turns fabric offcuts and recycled fibres into vivid boucherouites. Her workshop brings together eight weavers and gives a share of every sale back to the village school.",
    village: "Chichaoua",
    region: "Haouz — Marrakech-Safi",
    photoUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=80",
    craftSince: 2001,
  },
];

// ---------------------------------------------------------------------------
// Rugs
// ---------------------------------------------------------------------------

type SeedRug = {
  slug: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  nameAr?: string;
  type: RugType;
  widthCm: number;
  lengthCm: number;
  weightKg: number;
  materialFr: string;
  materialEn: string;
  materialAr?: string;
  originVillage: string;
  originRegion: string;
  originAr?: string;
  craftingDays: number;
  storyFr: string;
  storyEn: string;
  storyAr?: string;
  priceMad: number;
  stock: number;
  status: RugStatus;
  reservedUntil?: Date;
  isMadeToOrder: boolean;
  photos: string[];
  videoUrl?: string;
  certificateId: string;
  artisanSlug: string;
};

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

// Editorial galleries need 8–10 images. The seed lists three hero shots per
// rug; this pool fills the rest with complementary detail and atelier views.
const galleryExtras = [
  photo("photo-1600585154340-be6161a56a0c"),
  photo("photo-1600210492486-724fe5c67fb0"),
  photo("photo-1618221195710-dd6b41faaea6"),
  photo("photo-1600607687920-4e2a09cf159d"),
  photo("photo-1600566753086-00f18fb6b3ea"),
  photo("photo-1524758631624-e2822e304c36"),
  photo("photo-1493663284031-b7e3aefcae8e"),
  photo("photo-1594026112284-02bb6f3352fe"),
  photo("photo-1598300056393-4aac492f4344"),
];

function gallery(photos: string[]): string[] {
  return Array.from(new Set([...photos, ...galleryExtras])).slice(0, 9);
}

const rugs: SeedRug[] = [
  {
    slug: "atlas-neige-beni-ourain",
    sku: "ZA-BO-001",
    nameFr: "Atlas Neige",
    nameEn: "Atlas Snow",
    nameAr: "ثلج الأطلس",
    type: RugType.BENI_OURAIN,
    widthCm: 200,
    lengthCm: 300,
    weightKg: 12.5,
    materialFr: "Laine de mouton non teintée des Aït Bouguemez",
    materialEn: "Undyed sheep wool from the Aït Bouguemez flocks",
    materialAr: "صوف خروف غير مصبوغ من آيت بوكماز",
    originVillage: "Aït Bouguemez",
    originRegion: "Moyen Atlas — Province d'Azilal",
    originAr: "الأطلس المتوسط",
    craftingDays: 62,
    storyFr:
      "Un Beni Ourain de salon, tissé en laine vierge sur un métier vertical. Les lignes de losanges noirs racontent, dit-on, la carte des chemins de transhumance entre les villages du plateau. La laine haute et dense garde la chaleur en hiver et respire en été.",
    storyEn:
      "A living-room Beni Ourain, woven in virgin wool on an upright loom. Its lines of black diamonds are said to map the transhumance paths between the plateau villages. The deep, dense pile holds warmth in winter and breathes in summer.",
    storyAr:
      "سجادة بنى وارين لغرفة المعيشة، منسوجة من صوف خام على نول عمودي. تروي خطوط المعينات السوداء، كما يُقال، خريطة طرق الترحال بين قرى الهضبة. الوبرة العالية والكثيفة تُبقي الدفء في الشتاء وتتنفس في الصيف.",
    priceMad: 4200,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: false,
    photos: [
      photo("photo-1600166898405-da9535204843"),
      photo("photo-1584100936595-c0654b55a2e2"),
      photo("photo-1600585154340-be6161a56a0c"),
    ],
    videoUrl: "https://cdn.zarbia-atlas.ma/videos/atlas-neige-weaving.mp4",
    certificateId: "ZA-CERT-2026-0001",
    artisanSlug: "fatima-ait-bouzid",
  },
  {
    slug: "lune-berbere-beni-ourain",
    sku: "ZA-BO-002",
    nameFr: "Lune Berbère",
    nameEn: "Berber Moon",
    nameAr: "قمر أمازيغي",
    type: RugType.BENI_OURAIN,
    widthCm: 150,
    lengthCm: 250,
    weightKg: 8.2,
    materialFr: "Laine de mouton non teintée, coton naturel",
    materialEn: "Undyed sheep wool with a natural cotton warp",
    materialAr: "صوف خروف غير مصبوغ، قطن طبيعي",
    originVillage: "Aït Bouguemez",
    originRegion: "Moyen Atlas — Province d'Azilal",
    originAr: "الأطلس المتوسط",
    craftingDays: 48,
    storyFr:
      "Une pièce de format couloir ou chambre, au dessin plus aéré que celui des grands Beni Ourain. Les frises latérales reprennent le motif de la lune, protecteur du foyer dans la tradition berbère. La trame en coton naturel lui donne une souplesse immédiate.",
    storyEn:
      "A runner-sized piece for a hallway or bedroom, with a more open drawing than the large Beni Ourains. The side borders repeat the moon motif, a protector of the home in Berber tradition. The natural cotton warp makes it supple from the first day.",
    storyAr:
      "قطعة بحجم الممر أو غرفة النوم، بتصميم أكثر انفتاحاً من بنى وارين الكبيرة. تستعيد الإطارات الجانبية motif القمر، حامي المنزل في التقاليد الأمازيغية. تمنحها السداة القطنية الطبيعية مرونة فورية.",
    priceMad: 3200,
    stock: 1,
    status: RugStatus.RESERVED,
    reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
    isMadeToOrder: false,
    photos: [
      photo("photo-1615529182904-14819c35db37"),
      photo("photo-1600210492486-724fe5c67fb0"),
      photo("photo-1618221195710-dd6b41faaea6"),
    ],
    certificateId: "ZA-CERT-2026-0002",
    artisanSlug: "fatima-ait-bouzid",
  },
  {
    slug: "jardin-azilal",
    sku: "ZA-AZ-001",
    nameFr: "Jardin d'Azilal",
    nameEn: "Azilal Garden",
    nameAr: "حديقة أزيلال",
    type: RugType.AZILAL,
    widthCm: 160,
    lengthCm: 240,
    weightKg: 7.8,
    materialFr: "Laine de mouton teinte à la main, coton",
    materialEn: "Hand-dyed sheep wool with a cotton warp",
    materialAr: "صوف خروف مصبوغ يدوياً، قطن",
    originVillage: "Demnate",
    originRegion: "Moyen Atlas — Province d'Azilal",
    originAr: "الأطلس المتوسط",
    craftingDays: 48,
    storyFr:
      "Les Azilal se reconnaissent à leurs aplats de couleur libre, sans dessin préalable. Ici, l'indigo, le safran et la garance dessinent un jardin abstrait : chaque tisseuse y sème ses propres fleurs. Une pièce unique, signée au dos.",
    storyEn:
      "Azilal rugs are recognised by their free blocks of colour, woven without a prior drawing. Here indigo, saffron and madder form an abstract garden: every weaver plants her own flowers. A one-of-a-kind piece, signed on the reverse.",
    storyAr:
      "تُعرف سجاد أزيلال بمساحات لونها الحرة، دون رسم مسبق. هنا، النيلي والزعفران والقرمز ترسم حديقة تجريدية: كل نسّاجة تزرع أزهارها الخاصة. قطعة فريدة، موقّعة على الظهر.",
    priceMad: 3500,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: false,
    photos: [
      photo("photo-1616486338812-3dadae4b4ace"),
      photo("photo-1600607687920-4e2a09cf159d"),
      photo("photo-1600566753086-00f18fb6b3ea"),
    ],
    certificateId: "ZA-CERT-2026-0003",
    artisanSlug: "fatima-ait-bouzid",
  },
  {
    slug: "sentier-de-l-atlas-azilal",
    sku: "ZA-AZ-002",
    nameFr: "Sentier de l'Atlas",
    nameEn: "Atlas Path",
    nameAr: "طريق الأطلس",
    type: RugType.AZILAL,
    widthCm: 85,
    lengthCm: 300,
    weightKg: 6.4,
    materialFr: "Laine de mouton teinte à la main",
    materialEn: "Hand-dyed sheep wool",
    materialAr: "صوف خروف مصبوغ يدوياً",
    originVillage: "Demnate",
    originRegion: "Moyen Atlas — Province d'Azilal",
    originAr: "الأطلس المتوسط",
    craftingDays: 40,
    storyFr:
      "Un couloir tissé comme un chemin de montagne : bandes de safran et d'écru, ponctuées de losanges grenat. Le format étroit était traditionnellement posé le long des murs de terre des maisons du Doukkala. Il structure aujourd'hui les entrées contemporaines.",
    storyEn:
      "A runner woven like a mountain path: bands of saffron and ecru punctuated by garnet diamonds. This narrow format was traditionally laid along the earthen walls of Doukkala houses; today it frames contemporary entryways.",
    storyAr:
      "ممر منسوج كطريق جبلي: شرائط من الزعفران والبيج مقطوعة بمعينات عنابية. كان هذا الشكل الضيق يُوضع تقليدياً على طول جدران التراب في منازل دكالة. وهو يُهيكل اليوم المداخل المعاصرة.",
    priceMad: 2900,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: true,
    photos: [
      photo("photo-1600573472592-401b489a3cdc"),
      photo("photo-1524758631624-e2822e304c36"),
      photo("photo-1493663284031-b7e3aefcae8e"),
    ],
    certificateId: "ZA-CERT-2026-0004",
    artisanSlug: "fatima-ait-bouzid",
  },
  {
    slug: "confettis-de-chichaoua",
    sku: "ZA-BQ-001",
    nameFr: "Confettis de Chichaoua",
    nameEn: "Chichaoua Confetti",
    nameAr: "أزهار شيشاوة",
    type: RugType.BOUCHEROUITE,
    widthCm: 120,
    lengthCm: 180,
    weightKg: 4.2,
    materialFr: "Textiles recyclés, coton et fibres mixtes",
    materialEn: "Recycled textiles, cotton and mixed fibres",
    materialAr: "منسوجات معاد تدويرها، قطن وألياف مختلطة",
    originVillage: "Chichaoua",
    originRegion: "Haouz — Marrakech-Safi",
    originAr: "الحوز",
    craftingDays: 22,
    storyFr:
      "Le boucherouite est né de la nécessité : là où la laine manquait, les femmes ont tissé les chutes de vêtements. Ce tapis d'appoint réunit coton, acrylique et vieux draps dans une explosion de rose, de turquoise et de jaune. Chaque lavage intensifie ses couleurs.",
    storyEn:
      "Boucherouite was born of necessity: where wool was scarce, women wove clothing scraps instead. This small rug brings together cotton, acrylic and old sheets in an explosion of pink, turquoise and yellow. Every wash deepens its colours.",
    storyAr:
      "وُلد بوشرويط من الضرورة: حيث ندرت الصوف، نسجت النساء بقايا الملابس. تجمع هذه السجادة الصغيرة القطن والأكريليك والملاءات القديمة في انفجار من الوردي والفيروزي والأصفر. كل غسلة تُعمّق ألوانها.",
    priceMad: 1850,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: false,
    photos: [
      photo("photo-1555041469-a586c61ea9bc"),
      photo("photo-1519710164239-da123dc03ef4"),
      photo("photo-1567016432779-094069958ea5"),
    ],
    certificateId: "ZA-CERT-2026-0005",
    artisanSlug: "aicha-el-moudden",
  },
  {
    slug: "roseraie-de-haouz",
    sku: "ZA-BQ-002",
    nameFr: "Roseraie du Haouz",
    nameEn: "Haouz Rose Garden",
    nameAr: "حديقة ورود الحوز",
    type: RugType.BOUCHEROUITE,
    widthCm: 150,
    lengthCm: 210,
    weightKg: 5.6,
    materialFr: "Coton recyclé, laine résiduelle",
    materialEn: "Recycled cotton with residual wool",
    materialAr: "قطن معاد تدويره، صوف متبقي",
    originVillage: "Chichaoua",
    originRegion: "Haouz — Marrakech-Safi",
    originAr: "الحوز",
    craftingDays: 28,
    storyFr:
      "Inspirée des roseraies qui bordent l'oued Tensift, cette pièce marie rose poudré, ivoire et rouge profond. Les irrégularités de trame sont volontaires : elles rappellent que le tapis a été noué à la main, sans gabarit, sur plusieurs semaines.",
    storyEn:
      "Inspired by the rose fields along the Tensift river, this piece pairs powder pink, ivory and deep red. The irregularities in the weft are deliberate: they remind you the rug was knotted by hand, without a template, over several weeks.",
    storyAr:
      "مستوحاة من ورود وادي تنسيفت، تجمع هذه القطعة الوردي البودرة والعاج والأحمر العميق. تعمّد عدم انتظام النسيج: لتذكير بأن السجادة نُسجت يدوياً، دون قالب، على مدى أسابيع.",
    priceMad: 2350,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: true,
    photos: [
      photo("photo-1600210491892-03d54c0aaf87"),
      photo("photo-1615873968403-89e068629265"),
      photo("photo-1550226891-ef816aed4a98"),
    ],
    certificateId: "ZA-CERT-2026-0006",
    artisanSlug: "aicha-el-moudden",
  },
  {
    slug: "ocre-de-tahannaout-kilim",
    sku: "ZA-KL-001",
    nameFr: "Ocre de Tahannaout",
    nameEn: "Tahannaout Ochre",
    nameAr: "أُكْر تاحناوت",
    type: RugType.KILIM,
    widthCm: 170,
    lengthCm: 260,
    weightKg: 6.8,
    materialFr: "Laine teinte à la garance et à l'écorce de grenade",
    materialEn: "Wool dyed with madder root and pomegranate peel",
    materialAr: "صوف مصبوغ بجذور الفوة وقشر الرمان",
    originVillage: "Tahannaout",
    originRegion: "Haut Atlas — Al Haouz",
    originAr: "الأطلس الكبير",
    craftingDays: 55,
    storyFr:
      "Un kilim tissé à plat, sans velours, dont la trame est serrée au peigne. L'ocre dominant provient de la garance cultivée dans la vallée ; le noir profond, de l'écorce de grenade. Les motifs de peignes et de losanges ouverts rappellent les tapisseries des Aït Oussaden.",
    storyEn:
      "A flat-woven kilim with no pile, its weft beaten tight with a comb. The dominant ochre comes from madder grown in the valley; the deep black from pomegranate peel. Combs and open diamonds echo the tapestries of the Aït Oussaden.",
    storyAr:
      "كليم منسوج على نحو مسطح، دون وبرة، سداة مشدودة بالمشط. الأصفر السائد من الفوة المزروعة في الوادي؛ الأسود العميق من قشر الرمان. motifs المشط والمعينات المفتوحة تذكر بسجاد آيت أوسادن.",
    priceMad: 3800,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: false,
    photos: [
      photo("photo-1584100936595-c0654b55a2e2"),
      photo("photo-1600166898405-da9535204843"),
      photo("photo-1594026112284-02bb6f3352fe"),
    ],
    videoUrl: "https://cdn.zarbia-atlas.ma/videos/ocre-tahannaout-loom.mp4",
    certificateId: "ZA-CERT-2026-0007",
    artisanSlug: "khadija-ait-oussaden",
  },
  {
    slug: "nuit-de-l-ourika-hanbel",
    sku: "ZA-HB-001",
    nameFr: "Nuit de l'Ourika",
    nameEn: "Ourika Night",
    nameAr: "ليلة أوريكا",
    type: RugType.HANBEL,
    widthCm: 160,
    lengthCm: 280,
    weightKg: 9.1,
    materialFr: "Laine recyclée, coton",
    materialEn: "Recycled wool with cotton",
    materialAr: "صوف معاد تدويره، قطن",
    originVillage: "Tahannaout",
    originRegion: "Haut Atlas — Al Haouz",
    originAr: "الأطلس الكبير",
    craftingDays: 44,
    storyFr:
      "Le hanbel est le tapis de vie des maisons du Haut Atlas : tissé à plat, réversible, assez robuste pour la terre battue comme pour le salon. Celui-ci associe bandes indigo et écru, avec une bordure de motifs protecteurs. Il se retourne au fil des saisons.",
    storyEn:
      "The hanbel is the everyday rug of High Atlas homes: flat-woven, reversible, sturdy enough for packed earth or a modern living room. This one pairs indigo and ecru bands with a border of protective motifs, and can be turned with the seasons.",
    storyAr:
      "الحنبل هو سجادة حياة منازل الأطلس الكبير: منسوج على نحو مسطح، قابل للقلب، متين enough لالأرض المدكوكة كما لغرفة المعيشة. تجمع هذه القطعة شرائط نيلي وبيج، مع حدود motifs واقية. يُقلب مع تعاقب الفصول.",
    priceMad: 3050,
    stock: 1,
    status: RugStatus.AVAILABLE,
    isMadeToOrder: true,
    photos: [
      photo("photo-1618221195710-dd6b41faaea6"),
      photo("photo-1616486338812-3dadae4b4ace"),
      photo("photo-1598300056393-4aac492f4344"),
    ],
    certificateId: "ZA-CERT-2026-0008",
    artisanSlug: "khadija-ait-oussaden",
  },
];

// ---------------------------------------------------------------------------
// Demo engagement counters (safe to adjust; they only feed the admin report)
// ---------------------------------------------------------------------------

const seedViewCounts: Record<string, number> = {
  "ZA-BO-001": 412,
  "ZA-BO-002": 356,
  "ZA-AZ-001": 289,
  "ZA-AZ-002": 198,
  "ZA-BQ-001": 244,
  "ZA-BQ-002": 167,
  "ZA-KL-001": 322,
  "ZA-HB-001": 275,
};

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding Zarbia Atlas…");

  // 1. Currency rates
  for (const { currency, rate, source } of currencyRates) {
    await prisma.currencyRate.upsert({
      where: { currency },
      update: { rate: new Prisma.Decimal(rate.toFixed(6)), source },
      create: { currency, rate: new Prisma.Decimal(rate.toFixed(6)), source },
    });
  }
  console.log(`   ✓ ${currencyRates.length} currency rates`);

  // 2. Shipping rates
  let shippingCount = 0;
  for (const zone of shippingZones) {
    for (const bracket of zone.brackets) {
      const data = {
        zone: zone.zone,
        minWeightKg: new Prisma.Decimal(bracket.min.toFixed(2)),
        maxWeightKg: new Prisma.Decimal(bracket.max.toFixed(2)),
        priceMad: decimal(bracket.mad),
        priceEur: decimal(toEur(bracket.mad)),
        priceUsd: decimal(toUsd(bracket.mad)),
        carrier: zone.carrier,
        estimatedDaysMin: zone.days[0],
        estimatedDaysMax: zone.days[1],
        isActive: true,
      };

      await prisma.shippingRate.upsert({
        where: {
          zone_minWeightKg: {
            zone: zone.zone,
            minWeightKg: data.minWeightKg,
          },
        },
        update: data,
        create: data,
      });
      shippingCount += 1;
    }
  }
  console.log(`   ✓ ${shippingCount} shipping brackets across ${shippingZones.length} zones`);

  // 3. Artisans
  const artisanIds = new Map<string, string>();
  for (const artisan of artisans) {
    const saved = await prisma.artisan.upsert({
      where: { slug: artisan.slug },
      update: { ...artisan, isActive: true },
      create: { ...artisan, isActive: true },
    });
    artisanIds.set(saved.slug, saved.id);
  }
  console.log(`   ✓ ${artisans.length} artisans`);

  // 4. Rugs
  for (const rug of rugs) {
    const artisanId = artisanIds.get(rug.artisanSlug);
    if (!artisanId) {
      throw new Error(`Missing artisan "${rug.artisanSlug}" for rug "${rug.sku}"`);
    }

    const data = {
      slug: rug.slug,
      sku: rug.sku,
      nameFr: rug.nameFr,
      nameEn: rug.nameEn,
      nameAr: rug.nameAr ?? null,
      type: rug.type,
      widthCm: rug.widthCm,
      lengthCm: rug.lengthCm,
      weightKg: new Prisma.Decimal(rug.weightKg.toFixed(2)),
      materialFr: rug.materialFr,
      materialEn: rug.materialEn,
      materialAr: rug.materialAr ?? null,
      originVillage: rug.originVillage,
      originRegion: rug.originRegion,
      originAr: rug.originAr ?? null,
      craftingDays: rug.craftingDays,
      storyFr: rug.storyFr,
      storyEn: rug.storyEn,
      storyAr: rug.storyAr ?? null,
      priceMad: decimal(rug.priceMad),
      priceEur: decimal(toEur(rug.priceMad)),
      priceUsd: decimal(toUsd(rug.priceMad)),
      stock: rug.stock,
      status: rug.status,
      reservedUntil: rug.reservedUntil ?? null,
      isMadeToOrder: rug.isMadeToOrder,
      photos: gallery(rug.photos),
      videoUrl: rug.videoUrl ?? null,
      certificateId: rug.certificateId,
      artisanId,
    } satisfies Prisma.RugUncheckedCreateInput;

    await prisma.rug.upsert({
      where: { sku: rug.sku },
      update: data,
      // `viewCount` is only initialised on creation so re-seeding never wipes
      // real page-view analytics.
      create: { ...data, viewCount: seedViewCounts[rug.sku] ?? 0 },
    });
  }
  console.log(`   ✓ ${rugs.length} rugs`);

  // 5. Development administrator (password + TOTP)
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? "admin@zarbia-atlas.ma"
  )
    .trim()
    .toLowerCase();
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "change-this-password";
  const adminTotpSecret = (
    process.env.SEED_ADMIN_TOTP_SECRET ?? DEFAULT_ADMIN_TOTP_SECRET
  )
    .replace(/[\s-]/g, "")
    .toUpperCase();

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed an admin.",
    );
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashPassword(adminPassword),
      firstName: "Zarbia",
      lastName: "Admin",
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfirmedAt: null,
    },
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      firstName: "Zarbia",
      lastName: "Admin",
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfirmedAt: null,
    },
  });
  console.log(`   ✓ admin account ${adminEmail} (2FA disabled)`);

  const [rugCount, artisanCount, shippingRates, currencies] = await Promise.all([
    prisma.rug.count(),
    prisma.artisan.count(),
    prisma.shippingRate.count(),
    prisma.currencyRate.count(),
  ]);

  console.log(
    `✅ Done — ${rugCount} rugs, ${artisanCount} artisans, ${shippingRates} shipping rates, ${currencies} currencies.`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
