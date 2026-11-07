const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const files = walk("src/components").filter((f) => !f.includes("admin"));
const FR = /\b(le|la|les|un|une|des|du|de|et|pour|avec|votre|vos|notre|nos|vous|nous|est|sont|dans|sur|par|au|aux|ce|cette|ces|qui|que|plus|sans|tout|tous|toute|choisir|ajouter|voir|retour|livraison|paiement|commande|panier|prix|taille|couleur|quantité|disponible|vendu|réserver|découvrir|explorer|contacter|envoyer|recevoir|besoin|aide|question|réponse|article|journal|accueil|boutique|histoire|atelier|fait|main|pièce|pièces|tapis|tapis|zarbia|offert|gratuit|total|sous-total|réduction|adresse|ville|pays|nom|prénom|email|téléphone|message|suivant|précédent|continuer|terminer|valider|fermer|ouvrir|modifier|supprimer|enregistrer|annuler|confirmer|chargement|erreur|succès|aucun|aucune|déjà|encore|depuis|jusqu|entre|chaque|autre|même|très|bien|bon|meilleur|nouveau|nouvelle|grand|petite|petit|beau|belle|vrai|vraie|seul|seule|unique)\b/i;

const hits = [];
for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  // remove imports and code blocks inside braces
  src = src.replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const re = />\s*([^<>{}]{2,120}?)\s*</g;
  for (const m of src.matchAll(re)) {
    const text = m[1].replace(/\s+/g, " ").trim();
    if (!/[A-Za-zÀ-ÿ]{3}/.test(text)) continue;
    if (FR.test(text)) {
      const line = src.slice(0, m.index).split("\n").length;
      hits.push(`${path.relative(".", file)}:${line}: ${text}`);
    }
  }
}
console.log(hits.length + " suspicious JSX text nodes");
console.log(hits.join("\n"));
