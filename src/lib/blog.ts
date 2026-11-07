import type { Locale } from "./i18n";

/**
 * Editorial library — pure data, safe to import from server and client code.
 *
 * Every article exists in French, English and Arabic. The default locale is
 * French, so French is the source text and the other locales are full
 * translations rather than summaries. Sections are rendered in order by the
 * journal views.
 */

export interface BlogSection {
  headingFr: string;
  headingEn: string;
  headingAr?: string;
  paragraphsFr?: string[];
  paragraphsEn?: string[];
  paragraphsAr?: string[];
  bulletsFr?: string[];
  bulletsEn?: string[];
  bulletsAr?: string[];
  quoteFr?: string;
  quoteEn?: string;
  quoteAr?: string;
}

export interface BlogPost {
  slug: string;
  categoryFr: string;
  categoryEn: string;
  categoryAr?: string;
  titleFr: string;
  titleEn: string;
  titleAr?: string;
  excerptFr: string;
  excerptEn: string;
  excerptAr?: string;
  coverImage: string;
  coverAltFr: string;
  coverAltEn: string;
  coverAltAr?: string;
  publishedAt: string;
  readingMinutes: number;
  sections: BlogSection[];
}

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: "beni-ourain-vs-azilal",
    categoryFr: "Guide d’achat",
    categoryEn: "Buying guide",
    categoryAr: "دليل الشراء",
    titleFr: "Beni Ourain ou Azilal : comment choisir",
    titleEn: "Beni Ourain vs Azilal: how to choose",
    titleAr: "بني ورين أم أزيلال: كيف تختار",
    excerptFr:
      "Deux traditions voisines, deux grammaires opposées. Le fond clair et la ligne en relief d’un côté, la couleur vive et le motif naïf de l’autre. Voici comment décider sans se tromper.",
    excerptEn:
      "Two neighbouring traditions, two opposite grammars. A pale ground with raised linework on one side, vivid colour and naive motifs on the other. Here is how to decide well.",
    excerptAr:
      "تقليدان متجاوران وقاعدتان متعارضتان. أرضية فاتحة وخطوط بارزة من جهة، ولون صارخ ونقوش بريئة من جهة أخرى. إليك كيف تختار دون خطأ.",
    coverImage:
      "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1600&q=80",
    coverAltFr: "Tapis Beni Ourain à fond écru dans un salon lumineux",
    coverAltEn: "Ivory Beni Ourain rug in a bright living room",
    coverAltAr: "زربية بني ورين بأرضية عاجية في صالون مشرق",
    publishedAt: "2026-01-18",
    readingMinutes: 8,
    sections: [
      {
        headingFr: "Deux grammaires tissées à quelques vallées d’écart",
        headingEn: "Two grammars woven a few valleys apart",
        headingAr: "قاعدتان منسوجتان على بعد وديان قليلة",
        paragraphsFr: [
          "Les Beni Ourain et les Azilal viennent tous deux du Moyen Atlas, souvent des mêmes villages autour d’Azilal et d’Aït Bouguemez. Pourtant, tout les oppose dans le résultat : l’un parle bas, l’autre parle fort. Comprendre cette différence évite l’erreur la plus fréquente, qui consiste à acheter un Azilal pour un salon minimaliste puis à le trouver trop présent.",
          "La distinction n’est pas décorative, elle est structurelle. Elle tient à la laine, à la densité du nouage, à la palette et à la fonction d’origine de la pièce. Un Beni Ourain était un tapis de couchage, épais et chaud. Un Azilal était un tapis de vie, plus libre, souvent offert ou composé pour un événement familial.",
        ],
        paragraphsEn: [
          "Beni Ourain and Azilal rugs both come from the Middle Atlas, often from the same villages around Azilal and Aït Bouguemez. Yet everything separates them in the result: one speaks softly, the other speaks loudly. Understanding that difference avoids the most common mistake — buying an Azilal for a minimalist living room and finding it overwhelming.",
          "The distinction is structural rather than decorative. It comes from the wool, the knot density, the palette and the piece’s original function. A Beni Ourain was a sleeping rug: thick and warm. An Azilal was a living rug: freer, often given or composed for a family event.",
        ],
        paragraphsAr: [
          "تأتي زرابي بني ورين وأزيلال كلتاهما من الأطلس المتوسط، وغالباً من القرى نفسها حول أزيلال وآيت بوكماز. ومع ذلك، كل شيء يفرّقهما في النتيجة: إحداهما تتحدث بصوت خافت، والأخرى بصوت عالٍ. فهم هذا الفرق يجنّبك الخطأ الأكثر شيوعاً: شراء زربية أزيلال لصالون بسيط ثم إيجادها طاغية.",
          "الفرق ليس زخرفياً بل بنيوياً. يتعلق بالصوف وكثافة العقد ولوحة الألوان ووظيفة القطعة الأصلية. زربية بني ورين كانت زربية نوم، سميكة ودافئة. وأزيلال كانت زربية حياة، أكثر حرية، وغالباً تُهدى أو تُنسج لمناسبة عائلية.",
        ],
      },
      {
        headingFr: "Beni Ourain : la laine avant le dessin",
        headingEn: "Beni Ourain: wool before drawing",
        headingAr: "بني ورين: الصوف قبل الرسم",
        paragraphsFr: [
          "Le Beni Ourain classique est noué en laine de mouton non teintée, souvent écru, ivoire ou beige clair, sur une trame de coton. Le dessin est en relief : les lignes noires ou brunes sont nouées plus haut que le fond, ce qui crée cette surface moelleuse que l’on reconnaît au toucher. Les motifs sont sobres — losanges, treillis, lignes brisées, parfois un motif protecteur isolé.",
          "Sa densité et son épaisseur en font une pièce très confortable pieds nus, mais aussi une pièce qui demande de l’espace. Dans une petite pièce, un Beni Ourain trop grand mange le volume. Dans une grande pièce claire, il structure sans jamais concurrencer le mobilier.",
        ],
        paragraphsEn: [
          "The classic Beni Ourain is knotted in undyed sheep wool, often cream, ivory or pale beige, on a cotton warp. The drawing is raised: black or brown lines are knotted higher than the ground, creating that soft surface you recognise by touch. Motifs are restrained — diamonds, lattices, broken lines, sometimes a single protective motif.",
          "Its density and thickness make it very comfortable barefoot, but also a piece that needs space. In a small room, an oversized Beni Ourain swallows the volume. In a large, pale room it structures without ever competing with the furniture.",
        ],
        paragraphsAr: [
          "تُنسج زربية بني ورين الكلاسيكية من صوف خروف غير مصبوغ، غالباً كريمي أو عاجي أو بيج فاتح، على سداة قطنية. النقش بارز: الخطوط السوداء أو البنية تُعقد أعلى من الأرضية، ما يخلق هذا السطح الناعم الذي يُعرف باللمس. النقوش هادئة — معينات وشبكات وخطوط مكسورة، وأحياناً نقش حماية منفرد.",
          "كثافتها وسمكها يجعلانها مريحة جداً للقدمين الحافيتين، لكنها أيضاً قطعة تحتاج مساحة. في غرفة صغيرة، زربية بني ورين كبيرة جداً تبتلع الحجم. في غرفة كبيرة فاتحة، تنظّم دون أن تنافس الأثاث.",
        ],
        bulletsFr: [
          "Palette : écru, ivoire, sable, lignes brun-noir.",
          "Matière : laine épaisse non teintée, trame coton.",
          "Texture : velours haut, relief marqué, très doux.",
          "Style : minimal, contemporain, scandinave, méditerranéen.",
          "Point faible : les moutons clairs marquent plus vite ; rotation régulière indispensable.",
        ],
        bulletsEn: [
          "Palette: ivory, cream, sand, brown-black lines.",
          "Material: thick undyed wool, cotton warp.",
          "Texture: high pile, pronounced relief, very soft.",
          "Style: minimal, contemporary, Scandinavian, Mediterranean.",
          "Weak point: pale wools mark more easily; regular rotation is essential.",
        ],
        bulletsAr: [
          "الألوان: عاجي، كريمي، رملي، خطوط بنية سوداء.",
          "المادة: صوف سميك غير مصبوغ، سداة قطنية.",
          "الملمس: وبر عالٍ، بروز واضح، ناعم جداً.",
          "الأسلوب: بسيط، معاصر، إسكندنافي، متوسطي.",
          "نقطة الضعف: الصوف الفاتح يتسخ أسرع؛ التقليب المنتظم ضروري.",
        ],
      },
      {
        headingFr: "Azilal : la couleur comme langue",
        headingEn: "Azilal: colour as a language",
        headingAr: "أزيلال: اللون كلغة",
        paragraphsFr: [
          "L’Azilal est un tapis de laine teinte, souvent sur fond ivoire, où les motifs se déploient en rouge grenat, safran, indigo, vert olive ou rose. Le dessin est plus libre, plus dense, parfois asymétrique. Chaque pièce ressemble à une écriture : les artisanes composent sans carton, en avançant sur le métier. C’est ce qui rend les Azilal si difficiles à reproduire et si faciles à reconnaître.",
          "Contrairement à une idée reçue, l’Azilal n’est pas « un Beni Ourain coloré ». Le nouage est généralement plus serré, la laine plus fine, et la palette vient de teintures végétales ou de colorants soigneusement choisis. Le résultat est plus graphique, plus vibrant, avec une présence visuelle forte.",
        ],
        paragraphsEn: [
          "An Azilal is a rug of dyed wool, often on an ivory ground, where motifs unfold in pomegranate red, saffron, indigo, olive green or pink. The drawing is freer, denser, sometimes asymmetric. Each piece resembles handwriting: the artisans compose without a template, moving across the loom. That is what makes Azilal rugs so hard to reproduce and so easy to recognise.",
          "Contrary to a common belief, an Azilal is not “a colourful Beni Ourain”. The knotting is usually tighter, the wool finer, and the palette comes from plant dyes or carefully chosen colourants. The result is more graphic, more vibrant, with a strong visual presence.",
        ],
        paragraphsAr: [
          "زربية أزيلال من صوف مصبوغ، غالباً على أرضية عاجية، حيث تنتشر النقوش بالأحمر العقيقي والزعفراني والنيلي والزيتوني والوردي. الرسم أكثر حرية وكثافة، وأحياناً غير متماثل. كل قطعة تشبه كتابة: تنسج الحرفيات دون قالب، وهنّ يتقدمن على النول. هذا ما يجعل زرابي أزيلال صعبة التقليد وسهلة التمييز.",
          "خلافاً لفكرة شائعة، أزيلال ليست «بني ورين ملوّنة». العقد عادة أكثر إحكاماً، والصوف أنعم، والألوان تأتي من أصباغ نباتية أو مواد مختارة بعناية. النتيجة أكثر رسماً وحيوية، وحضورها البصري قوي.",
        ],
        bulletsFr: [
          "Palette : grenat, safran, indigo, olive, rose, ivoire.",
          "Matière : laine teintée, nouage plus serré.",
          "Texture : velours plus ras, motif dense et graphique.",
          "Style : bohème, éclectique, artisanal, coloré.",
          "Point fort : une pièce suffit à donner une âme à une pièce neutre.",
        ],
        bulletsEn: [
          "Palette: pomegranate, saffron, indigo, olive, rose, ivory.",
          "Material: dyed wool, tighter knotting.",
          "Texture: shorter pile, dense graphic motif.",
          "Style: bohemian, eclectic, crafted, colourful.",
          "Strength: one piece is enough to give a neutral room a soul.",
        ],
        bulletsAr: [
          "الألوان: عقيقي، زعفراني، نيلي، زيتوني، وردي، عاجي.",
          "المادة: صوف مصبوغ، عقد أكثر إحكاماً.",
          "الملمس: وبر أقصر، نقش كثيف ورسومي.",
          "الأسلوب: بوهيمي، انتقائي، حرفي، ملوّن.",
          "نقطة القوة: قطعة واحدة تكفي لمنح روح لغرفة محايدة.",
        ],
      },
      {
        headingFr: "Le prix et le temps ne racontent pas la même histoire",
        headingEn: "Price and time tell different stories",
        headingAr: "السعر والوقت لا يرويان الحكاية نفسها",
        paragraphsFr: [
          "À surface égale, un Azilal demande souvent plus de temps de nouage qu’un Beni Ourain, parce que le motif est plus dense et les changements de couleur plus fréquents. Un Beni Ourain de 250 × 350 cm peut demander six à dix semaines ; un Azilal très chargé peut dépasser douze semaines. Le prix au mètre carré reflète cette densité, pas seulement la renommée de la tradition.",
          "Méfiez-vous des écarts trop grands entre deux pièces de même taille : ils cachent souvent une laine mélangée, un nouage lâche ou une teinture industrielle. Une pièce honnête n’est jamais la moins chère du marché.",
        ],
        paragraphsEn: [
          "For the same surface, an Azilal often takes longer to knot than a Beni Ourain, because the motif is denser and colour changes are more frequent. A 250 × 350 cm Beni Ourain may take six to ten weeks; a heavily patterned Azilal can exceed twelve. The price per square metre reflects that density, not just the fame of the tradition.",
          "Be wary of very large gaps between two pieces of the same size: they often hide blended wool, loose knotting or industrial dye. An honest piece is never the cheapest on the market.",
        ],
        paragraphsAr: [
          "لنفس المساحة، تستغرق أزيلال عادة وقتاً أطول في العقد من بني ورين، لأن النقش أكثر كثافة وتغيّر الألوان أكثر تواتراً. زربية بني ورين 250 × 350 سم قد تستغرق ست إلى عشر أسابيع؛ وأزيلال شديدة النقش قد تتجاوز اثني عشر أسبوعاً. سعر المتر المربع يعكس هذه الكثافة، لا شهرة التقليد فقط.",
          "احذر الفروق الكبيرة جداً بين قطعتين من الحجم نفسه: غالباً ما تخفي صوفاً مخلوطاً أو عقداً مرتخياً أو صبغة صناعية. القطعة الصادقة ليست أبداً الأرخص في السوق.",
        ],
      },
      {
        headingFr: "Alors, lequel pour quelle pièce ?",
        headingEn: "So which one, for which room?",
        headingAr: "إذن، أيهما لأي غرفة؟",
        paragraphsFr: [
          "Pour un salon lumineux au mobilier bas et aux matières naturelles, le Beni Ourain reste imbattable : il adoucit la lumière, agrandit visuellement l’espace et vieillit bien. Pour une entrée, un bureau, une chambre d’enfant ou un salon déjà neutre, l’Azilal apporte l’énergie et la couleur sans nécessiter de décoration supplémentaire.",
          "Si vous hésitez encore, demandez-vous ce que vous voulez que la pièce fasse : apaiser ou raconter. Le Beni Ourain apaise. L’Azilal raconte. Les deux peuvent cohabiter dans une maison, à condition de ne pas les mettre dans la même pièce sans respiration.",
        ],
        paragraphsEn: [
          "For a bright living room with low furniture and natural materials, the Beni Ourain remains unbeatable: it softens the light, visually enlarges the space and ages well. For an entry, a study, a child’s room or an already neutral living room, the Azilal brings energy and colour without needing extra decoration.",
          "If you are still unsure, ask yourself what you want the piece to do: calm or tell a story. The Beni Ourain calms. The Azilal tells. Both can live in one house, provided you do not put them in the same room without breathing space.",
        ],
        paragraphsAr: [
          "لصالون مشرق بأثاث منخفض ومواد طبيعية، تبقى بني ورين لا تُنافس: تلطّف الضوء، توسّع المساحة بصرياً، وتشيخ جيداً. لمدخل أو مكتب أو غرفة طفل أو صالون محايد، تمنح أزيلال الطاقة واللون دون حاجة إلى ديكور إضافي.",
          "إن كنت لا تزال متردداً، اسأل نفسك ماذا تريد أن تفعل القطعة: أن تهدّئ أم أن تحكي. بني ورين تهدّئ. وأزيلال تحكي. يمكن أن تتعايشا في بيت واحد، شرط ألا تجمعهما في الغرفة نفسها دون مساحة تنفّس.",
        ],
        bulletsFr: [
          "Salon minimaliste ou bord de mer : Beni Ourain.",
          "Pièce neutre à réveiller : Azilal.",
          "Chambre : Beni Ourain pour le confort, Azilal pour la couleur.",
          "Entrée ou couloir : format runner dans les deux traditions.",
          "Petite pièce : privilégiez la dimension avant le motif.",
        ],
        bulletsEn: [
          "Minimalist or coastal living room: Beni Ourain.",
          "Neutral room needing life: Azilal.",
          "Bedroom: Beni Ourain for comfort, Azilal for colour.",
          "Entry or hallway: runner format in either tradition.",
          "Small room: choose the size before the motif.",
        ],
        bulletsAr: [
          "صالون بسيط أو قريب من البحر: بني ورين.",
          "غرفة محايدة تحتاج حياة: أزيلال.",
          "غرفة نوم: بني ورين للراحة، أزيلال للون.",
          "مدخل أو ممر: مقاس الممر في التقليدين.",
          "غرفة صغيرة: فضّل المقاس قبل النقش.",
        ],
        quoteFr:
          "Un tapis ne décore pas une pièce : il en règle le silence ou le bruit.",
        quoteEn:
          "A rug does not decorate a room: it sets its silence or its noise.",
        quoteAr: "الزربية لا تزيّن الغرفة: بل تضبط صمتها أو ضجيجها.",
      },
    ],
  },
  {
    slug: "clean-a-moroccan-rug",
    categoryFr: "Entretien",
    categoryEn: "Care",
    categoryAr: "العناية",
    titleFr: "Comment nettoyer un tapis marocain sans l’abîmer",
    titleEn: "How to clean a Moroccan rug without damaging it",
    titleAr: "كيف تنظّف زربية مغربية دون إتلافها",
    excerptFr:
      "Laine, teintures végétales, nouage main : un tapis marocain se nettoie moins souvent qu’on ne le croit, mais plus précisément. Le protocole complet, des miettes aux accidents.",
    excerptEn:
      "Wool, plant dyes, hand-knotting: a Moroccan rug needs less frequent cleaning than people think, but more precise cleaning. The complete protocol, from crumbs to accidents.",
    excerptAr:
      "صوف، أصباغ نباتية، عقد يدوي: الزربية المغربية تحتاج تنظيفاً أقل تكراراً مما يُظن، لكنه أدق. البروتوكول الكامل، من الفتات إلى الحوادث.",
    coverImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    coverAltFr: "Salon aux tons clairs avec un tapis en laine",
    coverAltEn: "Light-toned living room with a wool rug",
    coverAltAr: "صالون بدرجات فاتحة مع زربية صوف",
    publishedAt: "2026-02-02",
    readingMinutes: 9,
    sections: [
      {
        headingFr: "D’abord, identifiez la fibre et la teinture",
        headingEn: "First, identify the fibre and the dye",
        headingAr: "أولاً، تعرّف على الليف والصبغة",
        paragraphsFr: [
          "Tous les tapis marocains ne se nettoient pas de la même façon. Un Beni Ourain en laine non teintée supporte mieux l’eau qu’un Azilal aux teintures végétales, dont certaines peuvent dégorger. Un Boucherouite en textile recyclé ne doit jamais être détrempé. Un Kilim, plus fin, sèche vite mais se déforme facilement s’il est suspendu mouillé.",
          "Avant toute chose, lisez l’étiquette ou demandez à la personne qui vous a vendu la pièce. En l’absence d’information, testez sur un coin caché : tamponnez avec un chiffon blanc humide et vérifiez qu’aucune couleur ne migre.",
        ],
        paragraphsEn: [
          "Not every Moroccan rug is cleaned the same way. An undyed Beni Ourain tolerates water better than an Azilal with plant dyes, some of which may bleed. A Boucherouite made from recycled textiles must never be soaked. A Kilim, being finer, dries quickly but deforms easily if hung wet.",
          "Before anything else, read the label or ask the person who sold you the piece. Without information, test on a hidden corner: blot with a damp white cloth and check that no colour migrates.",
        ],
        paragraphsAr: [
          "ليست كل الزرابي المغربية تُنظّف بالطريقة نفسها. زربية بني ورين غير المصبوغة تتحمل الماء أفضل من أزيلال ذات الأصباغ النباتية، وبعضها قد يبهت. زربية بوشرويط المصنوعة من ألياف معاد تدويرها لا يجب أن تُغمر أبداً. والكليم، الأرق، يجف سريعاً لكنه يتشوّه بسهولة إذا عُلّق مبللاً.",
          "قبل كل شيء، اقرأ البطاقة أو اسأل من باعك القطعة. عند غياب المعلومة، اختبر في زاوية مخفية: اضغط بقطعة قماش بيضاء مبللة وتأكد أن اللون لا ينتقل.",
        ],
        bulletsFr: [
          "Laine non teintée : eau froide tolérée, séchage à plat.",
          "Laine teinte : eau froide, savon neutre, test de dégorgeage obligatoire.",
          "Kilim : nettoyage à sec ou spécialiste, jamais de trempage.",
          "Boucherouite : aspiration et nettoyage à sec uniquement.",
        ],
        bulletsEn: [
          "Undyed wool: cold water tolerated, dry flat.",
          "Dyed wool: cold water, mild soap, colour-fastness test required.",
          "Kilim: dry clean or specialist, never soak.",
          "Boucherouite: vacuum and dry clean only.",
        ],
        bulletsAr: [
          "صوف غير مصبوغ: ماء بارد مقبول، تجفيف مسطح.",
          "صوف مصبوغ: ماء بارد، صابون لطيف، اختبار ثبات اللون إجباري.",
          "كليم: تنظيف جاف أو مختص، لا نقع أبداً.",
          "بوشرويط: شفط وتنظيف جاف فقط.",
        ],
      },
      {
        headingFr: "L’entretien hebdomadaire, celui qui compte vraiment",
        headingEn: "The weekly care that actually matters",
        headingAr: "العناية الأسبوعية، التي تهم حقاً",
        paragraphsFr: [
          "La poussière est l’ennemi principal : elle s’installe entre les nœuds et use la laine par frottement. Aspirez une fois par semaine, sans brosse rotative, à puissance moyenne. Sur un tapis à poils longs, utilisez l’embout à fentes plutôt que la brosse. Retournez la pièce tous les trois mois pour que l’usure soit uniforme et que le soleil ne marque pas toujours le même côté.",
          "Secouez le tapis à l’extérieur deux ou trois fois par an, si son poids le permet. Un tapis de 250 × 350 cm est trop lourd pour être secoué seul : préférez un brossage doux à sec avec une brosse à poils souples, dans le sens de la trame.",
        ],
        paragraphsEn: [
          "Dust is the main enemy: it settles between the knots and wears the wool through friction. Vacuum once a week, without a rotating brush, at medium power. On a long-pile rug, use the crevice tool rather than the brush. Turn the piece every three months so wear is even and the sun does not always mark the same side.",
          "Shake the rug outside two or three times a year if its weight allows. A 250 × 350 cm rug is too heavy to shake alone: prefer a gentle dry brushing with a soft-bristled brush, following the warp.",
        ],
        paragraphsAr: [
          "الغبار هو العدو الأول: يستقر بين العقد ويستهلك الصوف بالاحتكاك. اكنس مرة في الأسبوع، دون فرشاة دوّارة، بقوة متوسطة. على زربية طويلة الوبر، استخدم فوهة الشقوق بدل الفرشاة. اقلب القطعة كل ثلاثة أشهر ليكون التآكل متساوياً وألا تترك الشمس أثراً على الجانب نفسه دائماً.",
          "انفض الزربية في الخارج مرتين أو ثلاثاً في السنة، إن سمح وزنها. زربية 250 × 350 سم ثقيلة جداً لتنفض وحدك: فضّل تنظيفاً جافاً لطيفاً بفرشاة ناعمة، في اتجاه السداة.",
        ],
        bulletsFr: [
          "Aspiration : une fois par semaine, sans brosse rotative.",
          "Rotation : tous les trois mois, tête-bêche.",
          "Soleil : évitez l’exposition directe prolongée, elle décolore les teintures.",
          "Secouage : deux à trois fois par an pour les petits formats.",
        ],
        bulletsEn: [
          "Vacuum: once a week, no rotating brush.",
          "Rotation: every three months, end to end.",
          "Sunlight: avoid prolonged direct exposure, it fades dyes.",
          "Shaking: two or three times a year for small formats.",
        ],
        bulletsAr: [
          "الشفط: مرة في الأسبوع، دون فرشاة دوّارة.",
          "التقليب: كل ثلاثة أشهر، رأساً على عقب.",
          "الشمس: تجنّب التعرض المباشر الطويل، فهو يبهت الأصباغ.",
          "النفض: مرتين إلى ثلاث سنوياً للمقاسات الصغيرة.",
        ],
      },
      {
        headingFr: "Une tache : les dix premières minutes décident",
        headingEn: "A stain: the first ten minutes decide",
        headingAr: "البقعة: أول عشر دقائق تقرر",
        paragraphsFr: [
          "Tamponnez, ne frottez jamais. Le frottement pousse la substance dans les nœuds et feutre la laine. Commencez par absorber le surplus avec un papier absorbant, toujours en partant de l’extérieur de la tache vers le centre pour éviter d’agrandir la zone. Puis tamponnez à l’eau froide avec un chiffon blanc propre.",
          "Si la tache résiste, ajoutez une goutte de savon neutre (savon de Marseille ou savon pour bébé) dans un bol d’eau froide. Tamponnez, rincez à l’eau claire froide, puis séchez à plat avec un linge propre en appuyant. N’utilisez jamais d’eau chaude : elle fixe les protéines et peut faire dégorger les teintures.",
        ],
        paragraphsEn: [
          "Blot, never rub. Rubbing pushes the substance into the knots and felts the wool. Start by absorbing the excess with paper towel, always working from the outside of the stain towards the centre so the area does not spread. Then blot with cold water and a clean white cloth.",
          "If the stain persists, add a drop of mild soap (Marseille or baby soap) to a bowl of cold water. Blot, rinse with clean cold water, then dry flat with a clean cloth, pressing down. Never use hot water: it sets proteins and can make dyes bleed.",
        ],
        paragraphsAr: [
          "اضغط، لا تفرك أبداً. الفرك يدفع المادة داخل العقد ويُلبد الصوف. ابدأ بامتصاص الفائض بورق نشاف، دائماً من خارج البقعة نحو المركز لتجنّب توسيعها. ثم اضغط بماء بارد وقطعة قماش بيضاء نظيفة.",
          "إذا قاومت البقعة، أضف قطرة صابون لطيف (صابون مرسيليا أو صابون أطفال) في وعاء ماء بارد. اضغط، اشطف بماء بارد نظيف، ثم جفّف مسطحاً بقطعة قماش نظيفة مع الضغط. لا تستخدم الماء الساخن أبداً: يثبّت البروتينات وقد يبهت الأصباغ.",
        ],
        bulletsFr: [
          "Liquide : papier absorbant, puis eau froide.",
          "Miettes et poudre : aspirateur, puis brosse douce à sec.",
          "Vin ou café : eau froide + savon neutre, sans frotter.",
          "Graisse : un peu de terre de Sommières, laissez agir, aspirez.",
          "Urine : eau froide + vinaigre blanc dilué, séchage à plat.",
        ],
        bulletsEn: [
          "Liquid: paper towel, then cold water.",
          "Crumbs and powder: vacuum, then a soft dry brush.",
          "Wine or coffee: cold water plus mild soap, no rubbing.",
          "Grease: a little Fuller’s earth, let it act, vacuum.",
          "Urine: cold water plus diluted white vinegar, dry flat.",
        ],
        bulletsAr: [
          "سائل: ورق نشاف، ثم ماء بارد.",
          "فتات ومسحوق: مكنسة، ثم فرشاة ناعمة جافة.",
          "نبيذ أو قهوة: ماء بارد + صابون لطيف، دون فرك.",
          "دهون: قليل من تراب سوميير، اتركه يعمل، ثم اشفط.",
          "بول: ماء بارد + خل أبيض مخفف، تجفيف مسطح.",
        ],
        quoteFr:
          "On ne lave pas un tapis : on l’empêche d’avoir besoin d’être lavé.",
        quoteEn:
          "You do not wash a rug: you keep it from needing to be washed.",
        quoteAr: "لا نغسل الزربية: بل نمنعها من الحاجة إلى الغسل.",
      },
      {
        headingFr: "Ce qu’il ne faut jamais faire",
        headingEn: "What you should never do",
        headingAr: "ما يجب ألا تفعله أبداً",
        paragraphsFr: [
          "La machine à laver est l’erreur la plus fréquente et la plus destructrice. Le tambour casse les fibres, l’essorage déforme la trame et les teintures dégorgent. Le sèche-linge est pire encore. La brosse dure, le balai-brosse et le nettoyeur vapeur haute pression abîment le nouage et feutrent la laine.",
          "Ne suspendez jamais un tapis mouillé : le poids de l’eau étire la pièce et crée des vagues définitives. Ne le laissez pas sécher au soleil direct non plus. Enfin, évitez les détachants universels à base de solvants forts : ils jaunissent la laine claire et attaquent les teintures naturelles.",
        ],
        paragraphsEn: [
          "The washing machine is the most common and most destructive mistake. The drum breaks fibres, the spin cycle deforms the warp and dyes bleed. The tumble dryer is worse still. A stiff brush, a broom brush and a high-pressure steam cleaner damage the knotting and felt the wool.",
          "Never hang a wet rug: the weight of the water stretches the piece and creates permanent waves. Do not let it dry in direct sun either. Finally, avoid universal stain removers based on strong solvents: they yellow pale wool and attack natural dyes.",
        ],
        paragraphsAr: [
          "الغسالة هي الخطأ الأكثر شيوعاً والأكثر تدميراً. الأسطوانة تكسر الألياف، والعصر يشوّه السداة والأصباغ تبهت. المجفّف أسوأ. الفرشاة الخشنة والممسحة ومنظّف البخار عالي الضغط تتلف العقد وتُلبد الصوف.",
          "لا تعلّق زربية مبللة أبداً: وزن الماء يمدّ القطعة ويخلق موجات دائمة. ولا تتركها تجف في الشمس المباشرة. وأخيراً، تجنّب مزيلات البقع العامة ذات المذيبات القوية: تصفّر الصوف الفاتح وتهاجم الأصباغ الطبيعية.",
        ],
        bulletsFr: [
          "Pas de machine à laver, pas de sèche-linge.",
          "Pas de nettoyeur vapeur ni de haute pression.",
          "Pas de brosse dure ni de brossage à sec énergique.",
          "Pas de suspension mouillée.",
          "Pas de détachant coloré ou parfumé sur laine claire.",
        ],
        bulletsEn: [
          "No washing machine, no tumble dryer.",
          "No steam cleaner or pressure washer.",
          "No stiff brush or vigorous dry brushing.",
          "Never hang a wet rug.",
          "No coloured or perfumed stain remover on pale wool.",
        ],
        bulletsAr: [
          "لا غسالة، لا مجفّف.",
          "لا منظّف بخار ولا ضغط عالٍ.",
          "لا فرشاة خشنة ولا فرك جاف قوي.",
          "لا تعليق مبلل.",
          "لا مزيل بقع ملوّن أو معطّر على صوف فاتح.",
        ],
      },
      {
        headingFr: "Le nettoyage profond, tous les trois à cinq ans",
        headingEn: "Deep cleaning, every three to five years",
        headingAr: "التنظيف العميق، كل ثلاث إلى خمس سنوات",
        paragraphsFr: [
          "Un tapis de salon utilisé quotidiennement mérite un nettoyage professionnel tous les trois à cinq ans. Choisissez un atelier qui travaille à l’eau froide, à plat, avec séchage contrôlé, et qui connaît les teintures végétales. Demandez si le tapis est testé pour la solidité des couleurs avant lavage.",
          "Entre deux nettoyages profonds, un brossage doux et une aspiration régulière suffisent. Si le tapis est stocké, roulez-le endroit vers l’extérieur, sans le compresser, dans un drap de coton respirant. Ne le rangez jamais dans un sac plastique fermé : l’humidité y crée des moisissures.",
        ],
        paragraphsEn: [
          "A living-room rug used daily deserves professional cleaning every three to five years. Choose an atelier that works with cold water, flat, with controlled drying, and that understands plant dyes. Ask whether the rug is tested for colour fastness before washing.",
          "Between deep cleans, gentle brushing and regular vacuuming are enough. If the rug is stored, roll it face outwards, without compressing it, in a breathable cotton sheet. Never store it in a sealed plastic bag: humidity creates mould.",
        ],
        paragraphsAr: [
          "زربية صالون تُستخدم يومياً تستحق تنظيفاً مهنياً كل ثلاث إلى خمس سنوات. اختر ورشة تعمل بالماء البارد، مسطحة، مع تجفيف مراقب، وتعرف الأصباغ النباتية. اسأل إن كانت الزربية تُختبر لثبات الألوان قبل الغسل.",
          "بين تنظيفين عميقين، يكفي تنظيف لطيف وشفط منتظم. إن كانت الزربية مخزّنة، لفّها من الوجه إلى الخارج، دون ضغط، في ملاءة قطنية تتنفس. لا تخزّنها أبداً في كيس بلاستيكي مغلق: الرطوبة تُنشئ العفن.",
        ],
        bulletsFr: [
          "Fréquence : tous les 3 à 5 ans pour un usage quotidien.",
          "Méthode : eau froide, à plat, séchage contrôlé.",
          "Stockage : roulé, dans du coton respirant, à l’abri de l’humidité.",
          "Avant lavage : test de solidité des couleurs.",
        ],
        bulletsEn: [
          "Frequency: every 3 to 5 years for daily use.",
          "Method: cold water, flat, controlled drying.",
          "Storage: rolled, in breathable cotton, away from damp.",
          "Before washing: colour-fastness test.",
        ],
        bulletsAr: [
          "التكرار: كل 3 إلى 5 سنوات للاستخدام اليومي.",
          "الطريقة: ماء بارد، مسطحة، تجفيف مراقب.",
          "التخزين: ملفوفة، في قطن يتنفس، بعيداً عن الرطوبة.",
          "قبل الغسل: اختبار ثبات الألوان.",
        ],
      },
      {
        headingFr: "Et les animaux ?",
        headingEn: "What about pets?",
        headingAr: "وماذا عن الحيوانات؟",
        paragraphsFr: [
          "Les poils se retirent avec une raclette en caoutchouc ou un gant humide, plus efficacement qu’un aspirateur seul. Pour une odeur persistante, saupoudrez du bicarbonate de soude, laissez agir une heure, puis aspirez. En cas d’accident, traitez immédiatement à l’eau froide et au vinaigre blanc dilué, puis séchez à plat.",
          "Si votre chat a griffé un coin, ne tirez pas sur les fils. Coupez proprement les fils coupés à ras et faites reprendre la lisière par un atelier. Une réparation précoce coûte toujours moins cher qu’un remplacement.",
        ],
        paragraphsEn: [
          "Hair lifts with a rubber squeegee or a damp glove more effectively than a vacuum alone. For lingering odour, sprinkle bicarbonate of soda, leave for an hour, then vacuum. After an accident, treat immediately with cold water and diluted white vinegar, then dry flat.",
          "If your cat has scratched a corner, do not pull the threads. Trim cut threads flush and have the edge repaired by an atelier. Early repair always costs less than replacement.",
        ],
        paragraphsAr: [
          "يُزال الشعر بمكشطة مطاطية أو قفاز مبلل، بفعالية أكبر من المكنسة وحدها. لرائحة عالقة، رشّ بيكربونات الصودا، اتركها ساعة، ثم اشفط. عند حادث، عالج فوراً بماء بارد وخل أبيض مخفف، ثم جفّف مسطحاً.",
          "إن خدشت قطتك زاوية، لا تسحب الخيوط. قصّ الخيوط المقطوعة بمستوى السطح واطلب إصلاح الحاشية من ورشة. الإصلاح المبكر يكلف دائماً أقل من الاستبدال.",
        ],
      },
    ],
  },
  {
    slug: "moroccan-rug-sizes-guide",
    categoryFr: "Guide des tailles",
    categoryEn: "Size guide",
    categoryAr: "دليل المقاسات",
    titleFr: "Guide des tailles : choisir la bonne dimension",
    titleEn: "Size guide: choosing the right dimensions",
    titleAr: "دليل المقاسات: اختيار البعد الصحيح",
    excerptFr:
      "Un beau tapis mal dimensionné ne fonctionne jamais. Les formats courants, les règles de placement pièce par pièce, et la méthode pour mesurer sans se tromper.",
    excerptEn:
      "A beautiful rug in the wrong size never works. Common formats, room-by-room placement rules, and a measuring method that gets it right.",
    excerptAr:
      "زربية جميلة بمقاس خاطئ لا تنجح أبداً. المقاسات الشائعة، قواعد التوزيع غرفة بغرفة، والطريقة للقياس دون خطأ.",
    coverImage:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
    coverAltFr: "Salon meublé avec un grand tapis sous le canapé",
    coverAltEn: "Furnished living room with a large rug under the sofa",
    coverAltAr: "صالون مفروش بزربية كبيرة تحت الأريكة",
    publishedAt: "2026-02-16",
    readingMinutes: 7,
    sections: [
      {
        headingFr: "Pourquoi les tapis marocains ne suivent pas les tailles standard",
        headingEn: "Why Moroccan rugs do not follow standard sizes",
        headingAr: "لماذا لا تتبع الزرابي المغربية المقاسات المعيارية",
        paragraphsFr: [
          "Un tapis marocain est noué sur un métier de bois, souvent sans plan précis. Les dimensions varient de quelques centimètres d’un bord à l’autre, et deux pièces de même annonce ne sont jamais identiques. C’est une signature, pas un défaut : la pièce a été tissée à la main, pas découpée dans un rouleau.",
          "Les formats que nous publions sont donc des mesures réelles, prises à plat, à ± 3 cm. Prévoir cette tolérance est essentiel dans une pièce où le tapis doit s’encastrer entre deux murs ou sous un meuble bas.",
        ],
        paragraphsEn: [
          "A Moroccan rug is knotted on a wooden loom, often without a precise plan. Dimensions vary by a few centimetres from one edge to the other, and two pieces from the same listing are never identical. That is a signature, not a defect: the piece was woven by hand, not cut from a roll.",
          "The formats we publish are therefore real measurements, taken flat, to within ± 3 cm. Allowing for that tolerance matters in a room where the rug must fit between two walls or under low furniture.",
        ],
        paragraphsAr: [
          "تُنسج الزربية المغربية على نول خشبي، غالباً دون مخطط دقيق. تتغير الأبعاد ببضعة سنتيمترات من حافة إلى أخرى، وقطعتان من الإعلان نفسه ليستا متطابقتين أبداً. هذه بصمة، لا عيب: القطعة نُسجت يدوياً، لا قُصّت من رول.",
          "المقاسات التي ننشرها هي إذن قياسات حقيقية، مأخوذة مسطحة، بهامش ± 3 سم. احتساب هذا الهامش ضروري في غرفة يجب أن تدخل فيها الزربية بين جدارين أو تحت أثاث منخفض.",
        ],
      },
      {
        headingFr: "Les formats courants, et ce qu’ils font vraiment",
        headingEn: "Common formats, and what they actually do",
        headingAr: "المقاسات الشائعة، وماذا تفعل حقاً",
        paragraphsFr: [
          "Les dimensions se lisent toujours largeur × longueur. Un tapis de 200 × 300 cm mesure deux mètres de large et trois mètres de long. C’est le format le plus polyvalent pour un salon : il permet de poser les pieds du canapé sur la laine sans envahir la pièce.",
        ],
        paragraphsEn: [
          "Dimensions are always read width × length. A 200 × 300 cm rug measures two metres wide and three metres long. It is the most versatile format for a living room: it lets the sofa feet rest on the wool without taking over the room.",
        ],
        paragraphsAr: [
          "تُقرأ الأبعاد دائماً عرضاً × طولاً. زربية 200 × 300 سم تعني مترين عرضاً وثلاثة أمتار طولاً. إنه المقاس الأكثر تنوعاً للصالون: يسمح بوضع أقدام الأريكة على الصوف دون اجتياح الغرفة.",
        ],
        bulletsFr: [
          "80 × 150 cm : petit tapis d’entrée, salle de bain, chevet.",
          "120 × 180 cm : bureau, chambre d’enfant, cuisine.",
          "160 × 230 cm : petit salon, chambre double, sous un lit.",
          "200 × 300 cm : salon standard, salle à manger de 6 personnes.",
          "250 × 350 cm : grand salon, salon ouvert sur salle à manger.",
          "300 × 400 cm : très grand salon, loft, pièce de réception.",
        ],
        bulletsEn: [
          "80 × 150 cm: small entry, bathroom, bedside.",
          "120 × 180 cm: study, child’s room, kitchen.",
          "160 × 230 cm: small living room, double bedroom, under a bed.",
          "200 × 300 cm: standard living room, six-seat dining room.",
          "250 × 350 cm: large living room, open-plan living/dining.",
          "300 × 400 cm: very large living room, loft, reception room.",
        ],
        bulletsAr: [
          "80 × 150 سم: زربية مدخل صغيرة، حمام، بجانب السرير.",
          "120 × 180 سم: مكتب، غرفة طفل، مطبخ.",
          "160 × 230 سم: صالون صغير، غرفة مزدوجة، تحت سرير.",
          "200 × 300 سم: صالون عادي، طاولة طعام لستة.",
          "250 × 350 سم: صالون كبير، صالون مفتوح على غرفة الطعام.",
          "300 × 400 سم: صالون كبير جداً، لوفت، غرفة استقبال.",
        ],
      },
      {
        headingFr: "Salon : la règle des pieds de devant",
        headingEn: "Living room: the front-legs rule",
        headingAr: "الصالون: قاعدة الأقدام الأمامية",
        paragraphsFr: [
          "Dans un salon, le tapis doit relier les meubles, pas flotter au milieu. La règle la plus fiable : les deux pieds avant du canapé reposent sur le tapis, les pieds arrière restent au sol. Le tapis dépasse d’au moins 20 cm de chaque côté du canapé et arrive à mi-chemin entre le canapé et la table basse.",
          "Si la pièce est petite, un tapis plus petit peut suffire : posez-le devant le canapé, sans le dessous, et laissez au moins 40 cm entre le tapis et les murs. Un tapis qui touche les murs fait paraître la pièce plus étroite, pas plus grande.",
        ],
        paragraphsEn: [
          "In a living room, the rug must connect the furniture, not float in the middle. The most reliable rule: both front feet of the sofa rest on the rug, the back feet stay on the floor. The rug extends at least 20 cm on each side of the sofa and reaches halfway between sofa and coffee table.",
          "If the room is small, a smaller rug can work: place it in front of the sofa, not underneath, and leave at least 40 cm between rug and walls. A rug that touches the walls makes a room look narrower, not larger.",
        ],
        paragraphsAr: [
          "في الصالون، يجب أن تربط الزربية الأثاث، لا أن تطفو في الوسط. القاعدة الأكثر موثوقية: ترتكز القدمان الأماميتان للأريكة على الزربية، وتبقى الخلفيتان على الأرض. تتجاوز الزربية 20 سم على الأقل من كل جانب من الأريكة وتصل إلى منتصف المسافة بين الأريكة والطاولة المنخفضة.",
          "إن كانت الغرفة صغيرة، قد تكفي زربية أصغر: ضعها أمام الأريكة، دون أسفلها، واترك 40 سم على الأقل بين الزربية والجدران. الزربية التي تلامس الجدران تجعل الغرفة تبدو أضيق، لا أوسع.",
        ],
        bulletsFr: [
          "Canapé 3 places : tapis d’au moins 200 × 300 cm.",
          "Canapé d’angle : 250 × 350 cm pour englober l’angle.",
          "Table basse : au moins 30 cm de laine visible tout autour.",
          "Espace mural : 40 à 60 cm de sol nu entre le tapis et le mur.",
        ],
        bulletsEn: [
          "Three-seat sofa: rug of at least 200 × 300 cm.",
          "Corner sofa: 250 × 350 cm to include the corner.",
          "Coffee table: at least 30 cm of visible wool all around.",
          "Wall gap: 40 to 60 cm of bare floor between rug and wall.",
        ],
        bulletsAr: [
          "أريكة بثلاثة مقاعد: زربية 200 × 300 سم على الأقل.",
          "أريكة زاوية: 250 × 350 سم لتشمل الزاوية.",
          "طاولة منخفضة: 30 سم على الأقل من الصوف المرئي حولها.",
          "مسافة الجدار: 40 إلى 60 سم من الأرض العارية بين الزربية والجدار.",
        ],
      },
      {
        headingFr: "Salle à manger : 60 à 70 cm autour de la table",
        headingEn: "Dining room: 60 to 70 cm around the table",
        headingAr: "غرفة الطعام: 60 إلى 70 سم حول الطاولة",
        paragraphsFr: [
          "Le tapis doit rester sous les chaises même lorsque celles-ci sont reculées. Comptez 60 à 70 cm de laine au-delà du bord de la table, de chaque côté. Pour une table de six personnes (180 × 90 cm), un tapis de 250 × 350 cm est souvent le bon format ; pour huit personnes, visez 300 × 400 cm.",
          "Un tapis trop petit sous une table à manger est le défaut le plus courant : les chaises se coincent sur la lisière, la laine s’use et le tapis glisse. Mieux vaut renoncer au tapis que de le choisir trop petit.",
        ],
        paragraphsEn: [
          "The rug must stay under the chairs even when they are pushed back. Allow 60 to 70 cm of wool beyond the table edge on every side. For a six-seat table (180 × 90 cm), 250 × 350 cm is often right; for eight seats, aim for 300 × 400 cm.",
          "A rug that is too small under a dining table is the most common mistake: chairs catch on the edge, the wool wears and the rug slides. Better to skip the rug than to choose it too small.",
        ],
        paragraphsAr: [
          "يجب أن تبقى الزربية تحت الكراسي حتى عندما تُسحب. احسب 60 إلى 70 سم من الصوف بعد حافة الطاولة، من كل جانب. لطاولة ستة أشخاص (180 × 90 سم)، غالباً 250 × 350 سم هو المقاس الصحيح؛ لثمانية أشخاص، استهدف 300 × 400 سم.",
          "الزربية الصغيرة جداً تحت طاولة الطعام هي العيب الأكثر شيوعاً: الكراسي تعلق على الحاشية، الصوف يتآكل والزربية تنزلق. الأفضل الاستغناء عن الزربية بدل اختيارها صغيرة جداً.",
        ],
      },
      {
        headingFr: "Chambre : la règle des deux tiers",
        headingEn: "Bedroom: the two-thirds rule",
        headingAr: "غرفة النوم: قاعدة الثلثين",
        paragraphsFr: [
          "Dans une chambre, le tapis doit couvrir environ deux tiers de la surface sous le lit, en dépassant d’au moins 50 cm de chaque côté. Un 160 × 230 cm convient pour un lit double si le tapis est placé dans le sens de la longueur, sous les deux tiers inférieurs. Un 200 × 300 cm permet de poser les pieds sur la laine au réveil, ce qui change tout.",
          "Pour un lit king size, visez 250 × 350 cm. Si la chambre est petite, un runner de chaque côté du lit est une alternative élégante et moins encombrante qu’un grand tapis partiellement caché.",
        ],
        paragraphsEn: [
          "In a bedroom, the rug should cover roughly two-thirds of the area under the bed, extending at least 50 cm on each side. A 160 × 230 cm works for a double bed if placed lengthways under the lower two-thirds. A 200 × 300 cm lets you step onto wool when you wake, which changes everything.",
          "For a king bed, aim for 250 × 350 cm. If the bedroom is small, a runner on each side of the bed is an elegant alternative and less cumbersome than a large rug that is partly hidden.",
        ],
        paragraphsAr: [
          "في غرفة النوم، يجب أن تغطي الزربية نحو ثلثي المساحة تحت السرير، متجاوزة 50 سم على الأقل من كل جانب. 160 × 230 سم مناسب لسرير مزدوج إذا وُضعت الزربية بالطول، تحت الثلثين السفليين. 200 × 300 سم تسمح بوضع القدمين على الصوف عند الاستيقاظ، وهذا يغيّر كل شيء.",
          "لسرير كينغ سايز، استهدف 250 × 350 سم. إن كانت الغرفة صغيرة، فممر على كل جانب من السرير بديل أنيق وأقل إزعاجاً من زربية كبيرة مخفية جزئياً.",
        ],
        bulletsFr: [
          "Lit double : 160 × 230 ou 200 × 300 cm.",
          "Lit king size : 250 × 350 cm.",
          "Petite chambre : deux runners de 80 × 150 cm.",
          "Toujours laisser au moins 50 cm de laine de chaque côté du lit.",
        ],
        bulletsEn: [
          "Double bed: 160 × 230 or 200 × 300 cm.",
          "King bed: 250 × 350 cm.",
          "Small bedroom: two 80 × 150 cm runners.",
          "Always leave at least 50 cm of wool on each side of the bed.",
        ],
        bulletsAr: [
          "سرير مزدوج: 160 × 230 أو 200 × 300 سم.",
          "سرير كينغ سايز: 250 × 350 سم.",
          "غرفة صغيرة: ممران 80 × 150 سم.",
          "اترك دائماً 50 سم على الأقل من الصوف على كل جانب من السرير.",
        ],
      },
      {
        headingFr: "La méthode de mesure en cinq minutes",
        headingEn: "The five-minute measuring method",
        headingAr: "طريقة القياس في خمس دقائق",
        paragraphsFr: [
          "Utilisez du ruban de masquage pour tracer au sol l’empreinte du tapis souhaité. Vivez avec ce rectangle pendant une journée : vous verrez immédiatement s’il est trop petit, trop proche d’un mur ou s’il gêne le passage. C’est la méthode la plus fiable, et la moins chère.",
          "Mesurez ensuite la largeur et la longueur de la zone tracée, ajoutez 5 cm de tolérance, et comparez avec les dimensions réelles de la pièce. Si vous commandez sur mesure, ces mesures deviennent le point de départ de l’atelier ; prévoyez toujours une marge de 5 à 10 cm sur les grands formats.",
        ],
        paragraphsEn: [
          "Use masking tape to mark the footprint of the desired rug on the floor. Live with that rectangle for a day: you will immediately see if it is too small, too close to a wall or blocks a walkway. It is the most reliable method, and the cheapest.",
          "Then measure the width and length of the marked area, add 5 cm of tolerance and compare with the piece’s real dimensions. If you are ordering bespoke, these measurements become the atelier’s starting point; always allow 5 to 10 cm extra on large formats.",
        ],
        paragraphsAr: [
          "استخدم شريط لاصق لرسم أثر الزربية المطلوبة على الأرض. عش مع هذا المستطيل يوماً: سترى فوراً إن كان صغيراً جداً، أو قريباً من جدار، أو يعيق المرور. إنها الطريقة الأكثر موثوقية والأقل تكلفة.",
          "قِس بعدها عرض وطول المنطقة المرسومة، أضف 5 سم هامشاً، وقارن بالأبعاد الحقيقية للقطعة. إن طلبت حسب المقاس، تصبح هذه القياسات نقطة انطلاق الورشة؛ احسب دائماً هامش 5 إلى 10 سم للمقاسات الكبيرة.",
        ],
        bulletsFr: [
          "Tracez l’empreinte au ruban de masquage.",
          "Vérifiez les passages de portes et les meubles bas.",
          "Mesurez, puis ajoutez 5 cm de tolérance.",
          "Pour le sur-mesure : indiquez la mesure finie souhaitée, pas la taille du métier.",
        ],
        bulletsEn: [
          "Mark the footprint with masking tape.",
          "Check door swings and low furniture.",
          "Measure, then add 5 cm of tolerance.",
          "For bespoke: give the finished size you want, not the loom size.",
        ],
        bulletsAr: [
          "ارسم الأثر بشريط لاصق.",
          "تحقق من فتحات الأبواب والأثاث المنخفض.",
          "قِس، ثم أضف 5 سم هامشاً.",
          "لحسب المقاس: أعطِ المقاس النهائي المطلوب، لا مقاس النول.",
        ],
        quoteFr:
          "Un tapis juste est un tapis qu’on oublie : on ne voit plus que la pièce.",
        quoteEn:
          "A well-sized rug is a rug you forget: you only see the room.",
        quoteAr: "الزربية الصحيحة هي التي تُنسى: لم تعد ترى إلا الغرفة.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getRelatedPosts(slug: string, limit = 2): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.slug !== slug).slice(0, limit);
}

export function blogTitle(post: BlogPost, locale: Locale): string {
  return locale === "ar" ? (post.titleAr ?? post.titleFr) : locale === "en" ? post.titleEn : post.titleFr;
}

export function blogExcerpt(post: BlogPost, locale: Locale): string {
  return locale === "ar" ? (post.excerptAr ?? post.excerptFr) : locale === "en" ? post.excerptEn : post.excerptFr;
}

export function blogCategory(post: BlogPost, locale: Locale): string {
  return locale === "ar" ? (post.categoryAr ?? post.categoryFr) : locale === "en" ? post.categoryEn : post.categoryFr;
}

export function blogCoverAlt(post: BlogPost, locale: Locale): string {
  return locale === "ar" ? (post.coverAltAr ?? post.coverAltFr) : locale === "en" ? post.coverAltEn : post.coverAltFr;
}

export function blogSectionHeading(section: BlogSection, locale: Locale): string {
  return locale === "ar"
    ? (section.headingAr ?? section.headingFr)
    : locale === "en"
      ? section.headingEn
      : section.headingFr;
}

export function blogSectionParagraphs(section: BlogSection, locale: Locale): string[] {
  if (locale === "ar") return section.paragraphsAr ?? section.paragraphsFr ?? [];
  if (locale === "en") return section.paragraphsEn ?? section.paragraphsFr ?? [];
  return section.paragraphsFr ?? [];
}

export function blogSectionBullets(section: BlogSection, locale: Locale): string[] {
  if (locale === "ar") return section.bulletsAr ?? section.bulletsFr ?? [];
  if (locale === "en") return section.bulletsEn ?? section.bulletsFr ?? [];
  return section.bulletsFr ?? [];
}

export function blogSectionQuote(section: BlogSection, locale: Locale): string | null {
  if (locale === "ar") return section.quoteAr ?? section.quoteFr ?? null;
  if (locale === "en") return section.quoteEn ?? section.quoteFr ?? null;
  return section.quoteFr ?? null;
}

export function formatBlogDate(iso: string, locale: Locale): string {
  const tag = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
