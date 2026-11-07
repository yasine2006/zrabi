import type { Locale } from "./i18n";

/**
 * Legal content, written once in the three storefront languages.
 *
 * These pages are deliberately plain (no animations, no marketing) so they
 * stay readable, printable and indexable. Update `UPDATED_AT` whenever the
 * wording changes — customers and payment providers both rely on it.
 */

export type LegalSlug = "terms" | "privacy" | "returns" | "notices";

export const LEGAL_SLUGS: readonly LegalSlug[] = [
  "terms",
  "privacy",
  "returns",
  "notices",
];

export const LEGAL_UPDATED_AT = "2026-11-06";

export interface LegalSection {
  heading: Record<Locale, string>;
  paragraphs?: Record<Locale, string[]>[];
  bullets?: Record<Locale, string[]>[];
}

export interface LegalDocument {
  slug: LegalSlug;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  sections: LegalSection[];
}

const CONTACT = {
  fr: "bonjour@zarbia-atlas.ma",
  en: "bonjour@zarbia-atlas.ma",
  ar: "bonjour@zarbia-atlas.ma",
} as const;

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  terms: {
    slug: "terms",
    title: {
      fr: "Conditions générales de vente",
      en: "Terms of sale",
      ar: "الشروط العامة للبيع",
    },
    intro: {
      fr: "Les présentes conditions régissent toute commande passée sur zarbia-atlas.ma. Elles s’appliquent aux ventes à distance vers le Maroc et l’international. En validant une commande, vous les acceptez sans réserve.",
      en: "These terms govern every order placed on zarbia-atlas.ma, including distance sales to Morocco and abroad. By confirming an order you accept them without reservation.",
      ar: "تحكم هذه الشروط كل طلب يتم على موقع zarbia-atlas.ma، بما في ذلك البيع عن بُعد داخل المغرب وخارجه. بتأكيد الطلب فإنك تقبلها دون تحفّظ.",
    },
    sections: [
      {
        heading: {
          fr: "1. Objet et identité du vendeur",
          en: "1. Scope and seller identity",
          ar: "1. الموضوع وهوية البائع",
        },
        paragraphs: [
          {
            fr: [
              "Zarbia Atlas vend des tapis marocains tissés main, des pièces uniques et des commandes sur mesure. L’atelier est situé à Aït Bouguemez, Moyen Atlas, Maroc.",
              "Les mentions d’immatriculation (identifiant commun de l’entreprise, registre de commerce) figurent sur la facture transmise avec chaque commande et sont communiquées sur simple demande à l’adresse de contact.",
            ],
            en: [
              "Zarbia Atlas sells handmade Moroccan rugs, one-of-a-kind pieces and bespoke commissions. The atelier is located in Aït Bouguemez, Middle Atlas, Morocco.",
              "Company registration details (common enterprise identifier, trade register) appear on the invoice sent with every order and are provided on request at the contact address.",
            ],
            ar: [
              "تبيع زربية أطلس زرابي مغربية منسوجة يدوياً وقطعاً فريدة وطلبات حسب الطلب. تقع الورشة في آيت بوكماز، الأطلس المتوسط، المغرب.",
              "ترد بيانات التسجيل القانوني (المعرّف المشترك للمقاولة والسجل التجاري) في الفاتورة المرفقة بكل طلب، وتُقدَّم عند الطلب عبر عنوان التواصل.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "2. Produits et disponibilité",
          en: "2. Products and availability",
          ar: "2. المنتجات والتوفّر",
        },
        paragraphs: [
          {
            fr: [
              "Chaque tapis est une pièce unique : les dimensions, motifs, couleurs et irrégularités de tissage peuvent varier légèrement par rapport aux photos. Ces variations signent le travail manuel et ne constituent pas un défaut.",
              "La disponibilité est affichée en temps réel. L’ajout au panier réserve la pièce pendant 15 minutes ; passé ce délai, elle redevient disponible pour d’autres clients.",
            ],
            en: [
              "Every rug is a unique piece: dimensions, patterns, colours and weaving irregularities may differ slightly from the photographs. These variations are the signature of handwork and are not defects.",
              "Availability is shown in real time. Adding a piece to the basket holds it for 15 minutes; after that it becomes available to other customers again.",
            ],
            ar: [
              "كل زربية قطعة فريدة: قد تختلف الأبعاد والنقوش والألوان وعدم انتظام النسج قليلاً عن الصور. هذه الاختلافات بصمة العمل اليدوي وليست عيباً.",
              "يُعرض التوفّر في الوقت الفعلي. إضافة القطعة إلى السلة تحجزها لمدة 15 دقيقة، وبعدها تعود متاحة لعملاء آخرين.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "3. Prix, paiement et frais",
          en: "3. Prices, payment and fees",
          ar: "3. الأسعار والدفع والرسوم",
        },
        paragraphs: [
          {
            fr: [
              "Les prix sont indiqués dans la devise sélectionnée. Le dirham marocain (MAD) est la devise de référence ; les montants en EUR et USD sont convertis au taux affiché au moment de la commande.",
              "Les frais de livraison sont calculés avant validation selon la zone et le poids du colis. Aucun frais caché n’est ajouté après le paiement.",
              "Au Maroc, le paiement à la livraison est disponible. À l’international, le paiement par carte est requis ; l’activation d’une carte dépend du pays et de l’émetteur.",
            ],
            en: [
              "Prices are shown in the selected currency. Moroccan dirham (MAD) is the reference currency; EUR and USD amounts are converted at the rate displayed when the order is placed.",
              "Shipping is calculated before confirmation from the destination zone and parcel weight. No hidden fee is added after payment.",
              "Cash on delivery is available in Morocco. International orders require card payment; card availability depends on the country and the issuer.",
            ],
            ar: [
              "تُعرض الأسعار بالعملة المختارة. الدرهم المغربي (MAD) هو العملة المرجعية، وتُحوَّل مبالغ EUR وUSD بسعر الصرف المعروض عند الطلب.",
              "يُحسب الشحن قبل التأكيد حسب منطقة الوجهة ووزن الشحنة. لا تُضاف أي رسوم خفية بعد الدفع.",
              "الدفع عند الاستلام متاح في المغرب. الطلبات الدولية تتطلب الدفع بالبطاقة، ويتوقف توفّر البطاقة على البلد والمُصدر.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "4. Commande sur mesure",
          en: "4. Bespoke orders",
          ar: "4. الطلبات حسب الطلب",
        },
        paragraphs: [
          {
            fr: [
              "Une commande sur mesure commence par un devis écrit. Le tissage ne démarre qu’après votre accord explicite et, le cas échéant, le versement de l’acompte indiqué (30 % du budget estimé).",
              "Les délais annoncés (généralement 6 à 10 semaines) sont indicatifs et peuvent varier selon la complexité du motif et la disponibilité des laines.",
            ],
            en: [
              "A bespoke commission starts with a written quote. Weaving begins only after your explicit approval and, where applicable, payment of the stated deposit (30% of the estimated budget).",
              "Announced lead times (usually 6 to 10 weeks) are indicative and may vary with pattern complexity and wool availability.",
            ],
            ar: [
              "يبدأ الطلب حسب الطلب بعرض سعر مكتوب. لا يبدأ النسج إلا بعد موافقتك الصريحة، وعند الاقتضاء أداء التسبيق المحدد (30% من الميزانية التقديرية).",
              "المدد المعلنة (عادة 6 إلى 10 أسابيع) تقديرية وقد تتغيّر حسب تعقيد النقش وتوفّر الأصواف.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "5. Droit applicable et litiges",
          en: "5. Governing law and disputes",
          ar: "5. القانون المطبق والنزاعات",
        },
        paragraphs: [
          {
            fr: [
              "Les présentes conditions sont soumises au droit marocain, sans préjudice des protections impératives dont bénéficient les consommateurs résidant dans l’Union européenne.",
              "En cas de désaccord, écrivez d’abord à l’adresse de contact : nous cherchons une solution amiable avant toute procédure.",
            ],
            en: [
              "These terms are governed by Moroccan law, without prejudice to mandatory protections available to consumers residing in the European Union.",
              "In case of disagreement, write to the contact address first: we look for an amicable solution before any proceedings.",
            ],
            ar: [
              "تخضع هذه الشروط للقانون المغربي، دون المساس بالحمايات الإلزامية المقررة للمستهلكين المقيمين في الاتحاد الأوروبي.",
              "عند أي خلاف، راسلنا أولاً على عنوان التواصل: نبحث عن حل ودي قبل أي إجراء قضائي.",
            ],
          },
        ],
      },
    ],
  },

  privacy: {
    slug: "privacy",
    title: {
      fr: "Politique de confidentialité",
      en: "Privacy policy",
      ar: "سياسة الخصوصية",
    },
    intro: {
      fr: "Nous collectons le minimum nécessaire pour traiter votre commande, vous livrer et répondre à vos questions. Cette page explique quelles données sont traitées, pourquoi et combien de temps.",
      en: "We collect the minimum needed to process your order, deliver it and answer your questions. This page explains which data is processed, why and for how long.",
      ar: "نجمع الحد الأدنى اللازم لمعالجة طلبك وتوصيله والرد على أسئلتك. توضح هذه الصفحة البيانات المعالجة وأسبابها ومدة حفظها.",
    },
    sections: [
      {
        heading: {
          fr: "1. Données collectées",
          en: "1. Data we collect",
          ar: "1. البيانات التي نجمعها",
        },
        bullets: [
          {
            fr: [
              "Identité et contact : nom complet, e-mail, téléphone.",
              "Livraison : adresse, ville, code postal, pays.",
              "Commande : pièces choisies, montants, devise, code promo éventuel.",
              "Technique : langue, devise, panier et favoris stockés dans votre navigateur.",
            ],
            en: [
              "Identity and contact: full name, e-mail, phone.",
              "Delivery: address, city, postcode, country.",
              "Order: selected pieces, amounts, currency, optional promo code.",
              "Technical: language, currency, basket and favourites stored in your browser.",
            ],
            ar: [
              "الهوية والتواصل: الاسم الكامل، البريد الإلكتروني، الهاتف.",
              "التوصيل: العنوان، المدينة، الرمز البريدي، البلد.",
              "الطلب: القطع المختارة، المبالغ، العملة، كود الخصم عند وجوده.",
              "تقني: اللغة والعملة والسلة والمفضّلة المحفوظة في متصفحك.",
            ],
          },
        ],
        paragraphs: [
          {
            fr: [
              "Nous ne stockons jamais le numéro complet de votre carte : les paiements par carte sont traités par nos prestataires certifiés (Stripe, CMI).",
            ],
            en: [
              "We never store your full card number: card payments are processed by our certified providers (Stripe, CMI).",
            ],
            ar: [
              "لا نحفظ رقم بطاقتك كاملاً أبداً: تُعالَج المدفوعات بالبطاقة عبر مزوّدينا المعتمدين (Stripe، CMI).",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "2. Finalités et bases légales",
          en: "2. Purposes and legal bases",
          ar: "2. الأغراض والأسس القانونية",
        },
        bullets: [
          {
            fr: [
              "Exécuter la vente : préparation, expédition et suivi de la commande.",
              "Répondre aux demandes : devis sur mesure, service client, réclamations.",
              "Respecter nos obligations comptables et fiscales.",
              "Avec votre accord : recevoir la lettre de l’Atlas (newsletter).",
            ],
            en: [
              "Perform the sale: preparing, shipping and tracking the order.",
              "Answer requests: bespoke quotes, customer service, complaints.",
              "Comply with accounting and tax obligations.",
              "With your consent: receive the Atlas letter (newsletter).",
            ],
            ar: [
              "تنفيذ البيع: إعداد الطلب وشحنه وتتبّعه.",
              "الرد على الطلبات: عروض حسب الطلب، خدمة العملاء، الشكايات.",
              "الامتثال للالتزامات المحاسبية والضريبية.",
              "بموافقتك: تلقّي رسائل الأطلس (النشرة البريدية).",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "3. Destinataires et transferts",
          en: "3. Recipients and transfers",
          ar: "3. المتلقّون وعمليات النقل",
        },
        paragraphs: [
          {
            fr: [
              "Vos données sont accessibles à l’équipe Zarbia Atlas et aux prestataires strictement nécessaires : transporteur, plateforme de paiement, hébergeur et service d’e-mail. Ils n’utilisent ces données que pour exécuter leur mission.",
              "Certains prestataires peuvent être situés hors du Maroc. Le cas échéant, le transfert s’appuie sur des garanties contractuelles appropriées.",
            ],
            en: [
              "Your data is accessible to the Zarbia Atlas team and the providers strictly required to fulfil the order: carrier, payment platform, hosting provider and e-mail service. They use it only for that purpose.",
              "Some providers may be located outside Morocco. Where applicable, transfers rely on appropriate contractual safeguards.",
            ],
            ar: [
              "تكون بياناتك متاحة لفريق زربية أطلس وللمزوّدين اللازمين فقط: الناقل، منصة الدفع، مستضيف الموقع وخدمة البريد. ولا يستعملونها إلا لهذا الغرض.",
              "قد يوجد بعض المزوّدين خارج المغرب. في هذه الحالة يعتمد النقل على ضمانات تعاقدية مناسبة.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "4. Durée de conservation et droits",
          en: "4. Retention and your rights",
          ar: "4. مدة الحفظ وحقوقك",
        },
        paragraphs: [
          {
            fr: [
              "Les commandes sont conservées le temps requis par la comptabilité et la garantie légale. Les données de prospection sont conservées jusqu’à désinscription. Les paniers et favoris restent dans votre navigateur jusqu’à ce que vous les effaciez.",
              "Vous pouvez demander l’accès, la rectification, l’effacement ou la portabilité de vos données, et vous opposer à la prospection à tout moment, en écrivant à l’adresse de contact. Une réponse vous est apportée dans un délai raisonnable.",
            ],
            en: [
              "Orders are kept for as long as accounting and legal warranty require. Marketing data is kept until you unsubscribe. Basket and favourites remain in your browser until you clear them.",
              "You may request access, correction, deletion or portability of your data, and object to marketing at any time, by writing to the contact address. We answer within a reasonable delay.",
            ],
            ar: [
              "تُحفظ الطلبات للمدة التي تتطلبها المحاسبة والضمانة القانونية. تُحفظ بيانات التسويق إلى حين إلغاء الاشتراك. تبقى السلة والمفضّلة في متصفحك إلى أن تحذفها.",
              "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو نقلها، والاعتراض على التسويق في أي وقت، بمراسلة عنوان التواصل. نجيب في أجل معقول.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "5. Cookies et stockage local",
          en: "5. Cookies and local storage",
          ar: "5. الكوكيز والتخزين المحلي",
        },
        paragraphs: [
          {
            fr: [
              "Le site utilise le stockage local du navigateur pour mémoriser la langue, la devise, le panier et les favoris. Aucun cookie publicitaire tiers n’est déposé. Vous pouvez effacer ces données à tout moment depuis les réglages de votre navigateur.",
            ],
            en: [
              "The site uses browser local storage to remember your language, currency, basket and favourites. No third-party advertising cookies are set. You can clear this data at any time from your browser settings.",
            ],
            ar: [
              "يستعمل الموقع التخزين المحلي للمتصفح لحفظ اللغة والعملة والسلة والمفضّلة. لا تُوضع أي كوكيز إعلانية تابعة لأطراف ثالثة. يمكنك حذف هذه البيانات في أي وقت من إعدادات متصفحك.",
            ],
          },
        ],
      },
    ],
  },

  returns: {
    slug: "returns",
    title: {
      fr: "Livraison, retours et remboursements",
      en: "Shipping, returns and refunds",
      ar: "التوصيل والإرجاع والاسترجاع",
    },
    intro: {
      fr: "Cette page détaille les délais, les frais et les conditions de retour. Elle complète les conditions générales de vente.",
      en: "This page details lead times, costs and return conditions. It complements the terms of sale.",
      ar: "توضّح هذه الصفحة المدد والتكاليف وشروط الإرجاع، وتكمّل الشروط العامة للبيع.",
    },
    sections: [
      {
        heading: {
          fr: "1. Expédition et délais",
          en: "1. Dispatch and lead times",
          ar: "1. الشحن والمدد",
        },
        bullets: [
          {
            fr: [
              "Maroc : 1 à 3 jours ouvrés, livraison offerte.",
              "Europe : 4 à 7 jours ouvrés.",
              "Amérique du Nord : 6 à 10 jours ouvrés.",
              "Moyen-Orient : 5 à 9 jours ouvrés.",
            ],
            en: [
              "Morocco: 1 to 3 business days, free delivery.",
              "Europe: 4 to 7 business days.",
              "North America: 6 to 10 business days.",
              "Middle East: 5 to 9 business days.",
            ],
            ar: [
              "المغرب: 1 إلى 3 أيام عمل، التوصيل مجاني.",
              "أوروبا: 4 إلى 7 أيام عمل.",
              "أمريكا الشمالية: 6 إلى 10 أيام عمل.",
              "الشرق الأوسط: 5 إلى 9 أيام عمل.",
            ],
          },
        ],
        paragraphs: [
          {
            fr: [
              "Chaque colis est suivi et remis contre signature. Le numéro de suivi vous est envoyé dès l’expédition. Les délais sont indicatifs et peuvent s’allonger lors des fêtes ou en cas de contrôle douanier.",
            ],
            en: [
              "Every parcel is tracked and delivered against signature. The tracking number is sent on dispatch. Lead times are indicative and may lengthen during holidays or customs checks.",
            ],
            ar: [
              "كل شحنة متتبعة وتُسلَّم مقابل التوقيع. يُرسل رقم التتبع عند الشحن. المدد تقديرية وقد تطول في الأعياد أو عند المراقبة الجمركية.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "2. Retour sous 14 jours",
          en: "2. Returning within 14 days",
          ar: "2. الإرجاع خلال 14 يوماً",
        },
        paragraphs: [
          {
            fr: [
              "Vous pouvez retourner une pièce dans les 14 jours suivant sa réception, à condition qu’elle soit inutilisée, non lavée et dans son emballage d’origine. Prévenez-nous par e-mail ou WhatsApp avant l’envoi : nous vous indiquons l’adresse de retour.",
              "Les frais de retour sont à votre charge, sauf erreur de notre part ou défaut caché. Nous recommandons un envoi suivi : la pièce reste sous votre responsabilité jusqu’à sa réception à l’atelier.",
            ],
            en: [
              "You may return a piece within 14 days of delivery, provided it is unused, unwashed and in its original packaging. Contact us by e-mail or WhatsApp before shipping: we will give you the return address.",
              "Return shipping is at your cost unless the mistake is ours or there is a hidden defect. We recommend a tracked shipment: the piece remains your responsibility until it reaches the atelier.",
            ],
            ar: [
              "يمكنك إرجاع القطعة خلال 14 يوماً من استلامها، شرط ألا تكون مستعملة أو مغسولة وأن تكون في تغليفها الأصلي. أخبرنا عبر البريد أو واتساب قبل الإرسال لنمنحك عنوان الإرجاع.",
              "تكاليف الإرجاع على عاتقك، إلا إذا كان الخطأ منّا أو وُجد عيب خفي. ننصح بالشحن المتتبع: تبقى القطعة تحت مسؤوليتك إلى حين وصولها إلى الورشة.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "3. Remboursement",
          en: "3. Refunds",
          ar: "3. الاسترجاع المالي",
        },
        paragraphs: [
          {
            fr: [
              "Après contrôle de la pièce, nous remboursons le montant payé sur le moyen de paiement d’origine, dans un délai de 14 jours. Les frais de livraison initiaux ne sont remboursés qu’en cas d’erreur de notre part.",
              "Les pièces sur mesure ne sont ni échangées ni remboursées une fois le tissage commencé, sauf défaut de fabrication.",
            ],
            en: [
              "After inspecting the piece, we refund the amount paid to the original payment method within 14 days. Initial shipping costs are refunded only when the mistake is ours.",
              "Bespoke pieces cannot be exchanged or refunded once weaving has begun, unless there is a manufacturing defect.",
            ],
            ar: [
              "بعد فحص القطعة، نعيد المبلغ المدفوع إلى وسيلة الدفع الأصلية خلال 14 يوماً. لا تُرد تكاليف الشحن الأولى إلا إذا كان الخطأ منّا.",
              "لا تُستبدل القطع حسب الطلب ولا تُسترجع بعد بدء النسج، إلا في حالة عيب في الصناعة.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "4. Pièce endommagée ou erreur",
          en: "4. Damaged item or wrong order",
          ar: "4. قطعة تالفة أو خطأ في الطلب",
        },
        paragraphs: [
          {
            fr: [
              "Si le colis arrive endommagé ou ne correspond pas à votre commande, refusez-le si possible et photographiez l’emballage. Écrivez-nous dans les 48 heures : nous prenons en charge le remplacement ou le remboursement complet, frais de retour inclus.",
            ],
            en: [
              "If the parcel arrives damaged or does not match your order, refuse it where possible and photograph the packaging. Write to us within 48 hours: we cover replacement or a full refund, including return shipping.",
            ],
            ar: [
              "إذا وصلت الشحنة تالفة أو لا تطابق طلبك، ارفضها إن أمكن وصوّر التغليف. راسلنا خلال 48 ساعة: نتحمّل الاستبدال أو الاسترجاع الكامل بما في ذلك تكاليف الإرجاع.",
            ],
          },
        ],
      },
    ],
  },

  notices: {
    slug: "notices",
    title: {
      fr: "Mentions légales",
      en: "Legal notices",
      ar: "الإشعارات القانونية",
    },
    intro: {
      fr: "Informations relatives à l’éditeur du site, à l’hébergement et à la propriété intellectuelle.",
      en: "Information about the site publisher, hosting and intellectual property.",
      ar: "معلومات حول ناشر الموقع والاستضافة والملكية الفكرية.",
    },
    sections: [
      {
        heading: {
          fr: "Éditeur",
          en: "Publisher",
          ar: "الناشر",
        },
        paragraphs: [
          {
            fr: [
              "Zarbia Atlas — atelier de tissage, Aït Bouguemez, Moyen Atlas, Maroc. Contact : bonjour@zarbia-atlas.ma.",
              "Les identifiants légaux (ICE, registre de commerce, identifiant fiscal) sont indiqués sur la facture et communiqués sur demande écrite.",
            ],
            en: [
              "Zarbia Atlas — weaving atelier, Aït Bouguemez, Middle Atlas, Morocco. Contact: bonjour@zarbia-atlas.ma.",
              "Legal identifiers (ICE, trade register, tax identifier) are printed on the invoice and provided on written request.",
            ],
            ar: [
              "زربية أطلس — ورشة نسج، آيت بوكماز، الأطلس المتوسط، المغرب. التواصل: bonjour@zarbia-atlas.ma.",
              "المعرّفات القانونية (ICE، السجل التجاري، المعرّف الضريبي) مطبوعة على الفاتورة وتُقدَّم بطلب كتابي.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "Hébergement",
          en: "Hosting",
          ar: "الاستضافة",
        },
        paragraphs: [
          {
            fr: [
              "Le site est hébergé sur une infrastructure cloud. Les coordonnées complètes de l’hébergeur sont disponibles sur demande à l’adresse de contact.",
            ],
            en: [
              "The site is hosted on cloud infrastructure. Full host details are available on request at the contact address.",
            ],
            ar: [
              "يستضيف الموقع بنية سحابية. توجد بيانات المستضيف الكاملة عند الطلب عبر عنوان التواصل.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "Propriété intellectuelle",
          en: "Intellectual property",
          ar: "الملكية الفكرية",
        },
        paragraphs: [
          {
            fr: [
              "Les textes, photographies, dessins et éléments graphiques du site sont protégés. Toute reproduction commerciale sans autorisation écrite est interdite. Les motifs traditionnels amazighs appartiennent au patrimoine collectif et ne font l’objet d’aucune appropriation.",
            ],
            en: [
              "The site’s texts, photographs, designs and graphic elements are protected. Any commercial reproduction without written permission is prohibited. Traditional Amazigh patterns belong to the collective heritage and are not appropriated.",
            ],
            ar: [
              "نصوص الموقع وصوره ورسومه وعناصره البيانية محمية. يُمنع أي استنساخ تجاري دون إذن كتابي. النقوش الأمازيغية التقليدية ملك للتراث الجماعي ولا تخضع لأي تملّك.",
            ],
          },
        ],
      },
      {
        heading: {
          fr: "Signalement",
          en: "Reporting",
          ar: "الإبلاغ",
        },
        paragraphs: [
          {
            fr: [
              `Pour signaler un contenu, une erreur ou un problème d’accès, écrivez à ${CONTACT.fr}. Nous répondons dans les meilleurs délais.`,
            ],
            en: [
              `To report content, an error or an accessibility issue, write to ${CONTACT.en}. We reply as soon as possible.`,
            ],
            ar: [
              `للإبلاغ عن محتوى أو خطأ أو مشكلة في الوصول، اكتب إلى ${CONTACT.ar}. نجيب في أقرب وقت.`,
            ],
          },
        ],
      },
    ],
  },
};

export function getLegalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS[slug as LegalSlug] ?? null;
}
