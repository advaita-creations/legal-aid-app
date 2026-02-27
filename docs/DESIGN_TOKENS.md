# Design Tokens — Legal Aid App

Extracted from Google Stitch wireframes (`00-external-artifacts/stitch_extracted/`).

## Colors

### Brand
```css
--primary: #1754cf;           /* Vibrant blue - buttons, links, active states */
```

### Backgrounds
```css
--background-light: #f8f9fc;  /* Light mode main background */
--background-dark: #111621;   /* Dark mode main background */
--card-light: #ffffff;        /* Light mode cards */
--card-dark: #1a1f2e;         /* Dark mode cards */
```

### Text
```css
--text-primary-light: #0e121b;
--text-primary-dark: #ffffff;
--text-secondary: #4e6797;    /* Muted text, placeholders */
```

### Status Colors
```css
--status-green: #07883b;      /* Processed, success */
--status-orange: #e73908;     /* Action required, pending */
--status-blue: #1754cf;       /* Processing, in-progress (uses primary) */
```

### Borders
```css
--border-light: #d0d7e7;
--border-dark: #2d3748;
```

## Typography

### Font Family
```css
font-family: 'Public Sans', sans-serif;
```

**Weights:** 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
```

### Font Sizes
- **Headings:** 28px (welcome), 20px (page titles), 18px (card titles)
- **Body:** 16px (base), 14px (inputs), 12px (labels), 10px (badges/nav)

## Border Radius
```css
--radius-default: 0.25rem;    /* 4px */
--radius-lg: 0.5rem;          /* 8px */
--radius-xl: 0.75rem;         /* 12px */
--radius-full: 9999px;        /* Fully rounded */
```

## Spacing
- **Card padding:** 16px (p-4)
- **Section spacing:** 24px (py-6)
- **Input height:** 56px (h-14)
- **Button height:** 56px (h-14)

## Icons
**Material Symbols Outlined** (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet"/>
```

**Settings:**
```css
font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```

## Components

### Buttons
- **Primary:** `bg-primary text-white h-14 px-5 rounded-lg font-bold`
- **Hover:** `hover:bg-primary/90`
- **Transition:** `transition-colors`

### Cards
- **Light:** `bg-white border border-[#d0d7e7] rounded-xl shadow-sm`
- **Dark:** `bg-[#1a1f2e] border border-[#2d3748] rounded-xl shadow-sm`

### Status Badges
- **Processed:** `bg-status-green/10 text-status-green`
- **Processing:** `bg-primary/10 text-primary`
- **Action Required:** `bg-status-orange/10 text-status-orange`
- **Style:** `px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide`

### Bottom Navigation (iOS Style)
- **Container:** `bg-white/80 backdrop-blur-lg border-t py-2 pb-6`
- **Active:** `text-primary`
- **Inactive:** `text-gray-400`
- **Label:** `text-[10px] font-bold` (active) / `font-medium` (inactive)

## Key Patterns

1. **Mobile-first iOS design** with bottom tab navigation
2. **Dark mode support** throughout (`.dark` class)
3. **Trust indicators** (encryption badge, social proof) on auth screens
4. **Rounded avatars** with status dots (green = online, orange = away)
5. **File number format:** `#LA-YYYY-NNN` (e.g., `#LA-2023-089`)

## Implementation Notes

### Tailwind Config
Update `tailwind.config.ts` to extend with these tokens:
```ts
colors: {
  primary: '#1754cf',
  'background-light': '#f8f9fc',
  'background-dark': '#111621',
  'status-green': '#07883b',
  'status-orange': '#e73908',
},
fontFamily: {
  sans: ['Public Sans', 'sans-serif'],
},
borderRadius: {
  DEFAULT: '0.25rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
},
```

### shadcn/ui Override
Current shadcn/ui uses Slate colors. To match Stitch:
- Replace `--primary` CSS variable with `#1754cf`
- Update `index.css` to use Public Sans
- Adjust card backgrounds to match Stitch's lighter grays
