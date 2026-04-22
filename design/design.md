# Profit AI — Trading Intelligence App

## Overview

Profit AI is a mobile-first dark-themed trading intelligence application that helps traders make better decisions by analyzing chart screenshots with AI. Users snap a photo of their trading chart, and the AI provides comprehensive analysis including trend signals, risk assessment, entry/exit strategies, stop-loss/take-profit levels, and a complete game plan.

The app features an immersive all-black aesthetic with subtle gray card surfaces, creating a premium, focused environment that traders expect. The emotional arc moves from the excitement of onboarding → the anticipation of chart analysis → the satisfaction of receiving detailed actionable insights → the confidence of tracking performance over time.

The visual language balances professional trading aesthetics (charts, data, indicators) with friendly AI personality, making complex financial analysis accessible to traders of all experience levels.

---

## Design Tokens

### Colors

The color system is built on a near-black foundation with carefully selected accent colors for different data states:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#000000` | App background |
| `--bg-card` | `#1C1C1E` | Card surfaces |
| `--bg-card-elevated` | `#2C2C2E` | Elevated cards, selected states |
| `--bg-input` | `#1C1C1E` | Input fields |
| `--bg-button` | `#FFFFFF` | Primary buttons (on dark bg) |
| `--bg-button-secondary` | `#1C1C1E` | Secondary buttons |
| `--text-primary` | `#FFFFFF` | Headlines, primary text |
| `--text-secondary` | `#8E8E93` | Labels, descriptions |
| `--text-muted` | `#636366` | Disabled, hints |
| `--accent-green` | `#34C759` | Positive values, bullish signals, profit |
| `--accent-red` | `#FF3B30` | Negative values, bearish signals, loss |
| `--accent-orange` | `#FF9500` | Warnings, "Not Ideal" status |
| `--accent-blue` | `#007AFF` | Links, interactive elements |
| `--accent-purple` | `#AF52DE` | AI/brain features, special highlights |
| `--border-subtle` | `#38383A` | Dividers, card borders |
| `--status-ideal` | `#34C759` | 4-dot indicator, fully green |
| `--status-not-ideal` | `#FF9500` | 2 orange + 2 gray dots |
| `--status-poor` | `#FF3B30` | 1 red + 3 gray dots |

### Typography

| Token | Font | Weight | Size | Line Height | Letter Spacing |
|-------|------|--------|------|-------------|----------------|
| `H1` | SF Pro Display / Inter | 700 | 32px | 38px | -0.022em |
| `H2` | SF Pro Display / Inter | 700 | 28px | 34px | -0.021em |
| `H3` | SF Pro Display / Inter | 600 | 22px | 28px | -0.019em |
| `H4` | SF Pro Display / Inter | 600 | 18px | 24px | -0.017em |
| `Body` | SF Pro Text / Inter | 400 | 16px | 22px | -0.011em |
| `BodySmall` | SF Pro Text / Inter | 400 | 14px | 20px | -0.009em |
| `Caption` | SF Pro Text / Inter | 500 | 12px | 16px | 0em |
| `Button` | SF Pro Text / Inter | 600 | 16px | 22px | -0.011em |
| `TabLabel` | SF Pro Text / Inter | 500 | 11px | 13px | 0.006em |
| `Display` | SF Pro Display / Inter | 800 | 40px | 48px | -0.022em |
| `DisplayXL` | SF Pro Display / Inter | 800 | 56px | 64px | -0.022em |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight gaps |
| `space-sm` | 8px | Small gaps |
| `space-md` | 12px | Standard card padding |
| `space-lg` | 16px | Section gaps |
| `space-xl` | 20px | Card margins |
| `space-2xl` | 24px | Section separation |
| `space-3xl` | 32px | Large section spacing |
| `space-4xl` | 48px | Screen edge padding (top) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small badges |
| `radius-md` | 12px | Cards, buttons |
| `radius-lg` | 16px | Large cards |
| `radius-xl` | 20px | Modals, bottom sheets |
| `radius-full` | 9999px | Pills, avatar, progress dots |

### Shadows (for dark theme)

Dark theme uses subtle glows instead of traditional shadows:

| Token | Value | Usage |
|-------|-------|-------|
| `glow-green` | `0 0 20px rgba(52, 199, 89, 0.3)` | Green status glow |
| `glow-orange` | `0 0 20px rgba(255, 149, 0, 0.3)` | Warning glow |
| `card-elevated` | `0 4px 24px rgba(0, 0, 0, 0.5)` | Elevated card shadow |
| `bottom-nav-glow` | `0 -4px 20px rgba(0, 0, 0, 0.6)` | Bottom nav shadow |

---

## Dependencies

```json
{
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.400.0",
  "recharts": "^2.12.0",
  "zustand": "^4.5.0"
}
```

---

## Shared Components

### BottomNavigation

Fixed bottom tab bar with 5 items. Background: `rgba(0, 0, 0, 0.85)` with `backdrop-filter: blur(20px)`.

| Tab | Icon (Lucide) | Route |
|-----|---------------|-------|
| Home | `Home` | `/` |
| AI Brain | `Brain` | `/ai-brain` |
| Analyze (center) | `Camera` (larger, 48px circle bg) | `/analyze` |
| Markets | `Atom` | `/markets` |
| Profile | `User` | `/profile` |

Specs:
- Tab bar height: 80px (including safe area)
- Center tab: 56px circle, bg `#1C1C1E`, border `1px solid #38383A`
- Active tab: icon strokeWidth 2.5, color `#FFFFFF`
- Inactive tab: icon strokeWidth 1.5, color `#636366`
- Active indicator: small 4px dot below icon in brand color
- Each tab label in `TabLabel` typography

### Header

Sticky header with:
- Left: Logo "📈 PROFIT AI" (H4, white) or back button
- Right: Info icon (`Info` lucide, 20px, `#8E8E93`) and Bookmark icon (`Bookmark`, 20px, `#8E8E93`)
- Height: 56px
- Background: `rgba(0, 0, 0, 0.85)` with `backdrop-filter: blur(20px)`

### Card

Reusable card component:
- Background: `#1C1C1E`
- Border radius: `radius-lg` (16px)
- Padding: `space-xl` (20px)
- Border: `1px solid #38383A` (subtle)

### InsightCard (2x2 Grid)

Small insight cards arranged in a 2x2 grid:
- Each card: icon (28px, in colored circle bg) + label (`Caption`, `#8E8E93`) + value (`H4`, white)
- Icon backgrounds use muted brand tones:
  - Trend: green circle bg `rgba(52, 199, 89, 0.15)`, icon `#34C759`
  - Signal: orange circle bg `rgba(255, 149, 0, 0.15)`, icon `#FF9500`
  - Risk Level: red circle bg `rgba(255, 59, 48, 0.15)`, icon `#FF3B30`
  - Volume: purple circle bg `rgba(175, 82, 222, 0.15)`, icon `#AF52DE`

### StatusIndicator

4-dot horizontal indicator showing strategy status:
- 4 circles, 8px diameter, 4px gap
- `--status-ideal`: all 4 green
- `--status-not-ideal`: 2 orange + 2 gray (`#38383A`)
- `--status-poor`: 1 red + 3 gray
- Transition: `width 0.3s ease, background-color 0.3s ease`

### StrategyCard

Card showing active strategy:
- Chevron right indicator
- Strategy name: `Body` weight 500, white
- Status text: `BodySmall`, color based on status
- StatusIndicator component below

### Button

Two variants:
- **Primary**: bg `#FFFFFF`, text `#000000`, border-radius `radius-full`, padding `16px 24px`, font `Button`
- **Secondary**: bg `#1C1C1E`, text `#FFFFFF`, border `1px solid #38383A`, border-radius `radius-full`, padding `16px 24px`, font `Button`

### LoadingDots

Three dots animation for loading states:
- 3 circles, 8px diameter, primary color
- Sequential bounce animation: `animation: bounce 1.4s infinite ease-in-out both`
- Delays: 0s, 0.16s, 0.32s

### SectionAccordion

Expandable sections for detailed analysis:
- Header: title (`H4`) + chevron icon that rotates 180deg on open
- Content: `Body` text with `space-md` padding-top
- Border bottom: `1px solid #38383A`
- Animation: `height 0.3s ease, opacity 0.3s ease`

---

## Global Interactions

### Page Transitions

**Mobile-native slide transitions** between screens:
- **Push navigation**: new screen slides in from right (`translateX(100%)` → `translateX(0)`), previous screen slides left (`translateX(0)` → `translateX(-30%)`), duration 0.35s, ease `cubic-bezier(0.32, 0.72, 0, 1)`
- **Pop navigation**: reverse of push
- **Tab switching**: cross-fade, opacity 0→1, duration 0.2s
- **Modal/Bottom sheet**: slides up from bottom (`translateY(100%)` → `translateY(0)`), duration 0.4s, ease `cubic-bezier(0.2, 0.8, 0.2, 1)`

### Scroll Behaviors

- **Home feed**: vertical scroll with momentum, header blur intensifies on scroll (`backdrop-filter: blur(20px)`)
- **Analysis results**: vertical scroll, accordion sections expand with spring animation
- **Journal dashboard**: horizontal scroll for performance cards, vertical for main content
- **Profile/Settings**: vertical scroll with grouped sections

### Loading States

- **Chart analysis**: "Analyzing Chart" text with LoadingDots animation on dark overlay
- **Screen transitions**: skeleton screens matching card shapes, shimmer animation `background: linear-gradient(90deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)`, `background-size: 200% 100%`, `animation: shimmer 1.5s infinite`

### Button Interactions

- **Tap**: scale to 0.96, duration 0.1s
- **Release**: scale back to 1, duration 0.2s with spring
- **Loading state**: opacity 0.7, pointer-events none

### Card Interactions

- **Tap**: scale to 0.98, bg lightens slightly
- **Long press on chart**: haptic feedback + enlarge preview

### Pull-to-Refresh

On Home and Journal screens:
- Pull down > 60px triggers refresh
- Spinner: circular progress indicator in `#FFFFFF`
- Content shifts down with spring physics

---

## Core Effects

### Trading Chart Background

A subtle animated background pattern that reinforces the trading theme. Appears behind the analysis preview card on the home screen and as a decorative element on empty states.

**Technique**: CSS-only using repeating-linear-gradient to create candlestick-like bars, animated with a slow horizontal drift.

Implementation:
- Container with `overflow: hidden`, full width, 200px height
- Background pattern using `repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(52, 199, 89, 0.03) 8px, rgba(52, 199, 89, 0.03) 12px, transparent 12px, transparent 20px, rgba(255, 59, 48, 0.03) 20px, rgba(255, 59, 48, 0.03) 24px)`
- Animation: `background-position` shifts from `0 0` to `40px 0` over 20s, linear, infinite
- Creates subtle impression of moving candlestick charts in background

### AI Pulse Glow

Subtle pulsing glow effect around the central camera button and AI-related elements to suggest intelligence and activity.

**Technique**: CSS box-shadow animation.

Implementation:
- On center camera tab button:
- `@keyframes pulse-glow`: 
  - 0%: `box-shadow: 0 0 0 0 rgba(175, 82, 222, 0.4)`
  - 70%: `box-shadow: 0 0 0 12px rgba(175, 82, 222, 0)`
  - 100%: `box-shadow: 0 0 0 0 rgba(175, 82, 222, 0)`
- Animation: `pulse-glow 2s infinite`

### Status Dot Animation

When strategy status changes, the dots animate sequentially.

**Technique**: Staggered CSS transitions.

Implementation:
- Each dot has `transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`
- When status updates, dots fill with brand color with 0.1s stagger delay between each
- Creates a "filling up" effect

### Number Counter Animation

For financial figures (Net P/L, Win Rate, Trader Score), numbers count up from 0 to final value.

**Technique**: Framer Motion `useMotionValue` + `useTransform` + `animate`.

Implementation:
- `useMotionValue(0)` → `animate(motionValue, targetValue, { duration: 1.5, ease: "easeOut" })`
- `useTransform` to round to appropriate decimal places
- `useSpring` for smoother interpolation on Trader Score
- Only triggers when element enters viewport (IntersectionObserver)

### Gradient Text (Hero Titles)

Used on marketing/landing screens for emphasis.

**Technique**: CSS `background-clip: text`.

Implementation:
- `background: linear-gradient(135deg, #FFFFFF 0%, #8E8E93 100%)`
- `-webkit-background-clip: text`
- `-webkit-text-fill-color: transparent`
- Creates subtle depth on large headlines

---

## Notes

### Font Strategy

Primary: **Inter** (Google Fonts) — weights 400, 500, 600, 700, 800. Use `font-display: swap`. Install via `<link>` in `index.html`.

### Icon Strategy

All functional icons from **Lucide React**. Decorative/illustration icons (brain, camera flash, chart illustrations) can be SVG components or generated images.

### Image Strategy

- Chart screenshots: uploaded by users via camera/file picker
- Avatars: generated if needed
- Icons for features: use Lucide or custom SVG
- Marketing illustrations: can use generated images with prompt trading-themed abstract illustrations, dark background, minimal style

### Responsive

Design is mobile-first (375px - 430px width). For web deployment:
- Center the mobile viewport on larger screens
- Use a device-frame wrapper or pure centered layout with `max-width: 430px`, `margin: 0 auto`
- Background outside the mobile viewport: `#000000` or subtle gradient

### Accessibility

- All interactive elements have minimum 44px touch target
- Color is not the sole indicator — use icons + text for statuses
- Focus states visible for keyboard navigation
- Reduced motion: disable all animations when `prefers-reduced-motion: reduce`
