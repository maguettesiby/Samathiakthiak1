# 🎨 Logo SamaThiakThiak

## Fichiers Disponibles

### 📁 Structure des Assets

```
frontend/public/images/
├── logo.svg              ← Logo SVG sans background (format vectoriel)
└── logo.png              ← Logo PNG transparent (à générer)
```

## 📌 Utilisation

### Dans React/TypeScript:

```tsx
// Utiliser le logo SVG
<img 
  src="/images/logo.svg" 
  alt="SamaThiakThiak" 
  className="h-10 w-10"
/>

// Ou avec une image PNG si disponible
<img 
  src="/images/logo.png" 
  alt="SamaThiakThiak" 
  className="h-10 w-10"
/>
```

### En CSS/HTML:

```html
<!-- SVG -->
<img src="/images/logo.svg" alt="SamaThiakThiak" style="height: 40px;">

<!-- PNG -->
<img src="/images/logo.png" alt="SamaThiakThiak" style="height: 40px;">
```

## 🎯 Caractéristiques du Logo

### Design:
- 🛡️ **Shield Icon** - Symbole de protection et sécurité
- 🔵 **Color**: Bleu (#003D7A) + Orange (#F39200)
- ⬆️ **Arrow**: Représente la rapidité et la progression
- 📐 **Scalable**: Format SVG (vectoriel)

### Versions:
- **SVG**: Sans background, scalable à l'infini
- **PNG**: Version bitmap pour webp ou affichage spécifique

## 🔄 Où Utiliser

✅ **Header**: Logo dans la navigation
✅ **Footer**: Logo dans les informations de marque
✅ **Favicon**: Icône du navigateur (32x32px)
✅ **Social Media**: Logo pour réseaux sociaux
✅ **Print**: Logo pour documents imprimés
✅ **Email**: Logo pour signatures email

## 📐 Dimensions Recommandées

| Contexte | Taille | Format |
|----------|--------|--------|
| Header/Footer | 40-50px | SVG ou PNG |
| Favicon | 32x32px | PNG, ICO |
| Mobile Menu | 32-36px | SVG ou PNG |
| Social Links | 24-32px | SVG ou PNG |
| Print | 100%+ | SVG (vectoriel) |

## 🎨 Personnalisation

### Changer les Couleurs:

Éditez `logo.svg` et modifiez:
- `stroke="#003D7A"` → Couleur du contour (Bleu)
- `fill="#F39200"` → Couleur de remplissage (Orange)

### Exemples:
```svg
<!-- Bleu sombre -->
<path stroke="#0F172A" fill="#003D7A" />

<!-- Gradient -->
<defs>
  <linearGradient id="grad">
    <stop offset="0%" style="stop-color:#3B82F6" />
    <stop offset="100%" style="stop-color:#003D7A" />
  </linearGradient>
</defs>
<path fill="url(#grad)" />
```

## 💾 Export PNG depuis SVG

### Option 1: Utiliser un outil en ligne
- Convertio.co (SVG → PNG)
- CloudConvert.com
- Zamzar.com

### Option 2: Utiliser ImageMagick (ligne de commande)
```bash
convert -background none logo.svg logo.png
```

### Option 3: Utiliser Inkscape
1. Ouvrir logo.svg
2. Fichier → Exporter PNG
3. Sélectionner les dimensions
4. Exporter

## ✨ Avantages SVG

✅ **Scalable** - Fonctionne à toutes les tailles
✅ **Petit fichier** - ~2-5KB
✅ **Modifiable** - Éditez le code SVG directement
✅ **Transparent** - Background transparent
✅ **SEO-friendly** - Texte dans le SVG est indexable

## 📚 Ressources

- [SVG Docs](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [Logo Design Best Practices](https://www.brandingmag.com)
- [Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

**Version**: 1.0
**Date**: Février 2026
**Format**: SVG (Scalable Vector Graphics)
**Background**: Transparent ✅
