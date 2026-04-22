# Profit AI — Application Architecture

## Navigation Structure

```
App (Mobile viewport wrapper)
├── Stack Navigator (for push/pop transitions)
│   ├── MainTabs (Bottom Tab Navigator)
│   │   ├── HomeScreen (Tab: Home)
│   │   ├── AIBrainScreen (Tab: AI Brain)
│   │   ├── AnalyzeScreen (Tab: Camera - center)
│   │   ├── MarketsScreen (Tab: Markets)
│   │   └── ProfileScreen (Tab: Profile)
│   │
│   └── Detail Screens (pushed on top of tabs)
│       ├── AnalysisDetailScreen
│       ├── StrategyDetailScreen
│       ├── SLTPDetailScreen
│       └── GamePlanDetailScreen
│
└── Onboarding Stack (shown first-time only, no tabs)
    ├── SplashScreen
    ├── LandingScreen
    ├── OnboardingFeaturesScreen
    ├── ExperienceSelectScreen
    ├── MarketSelectScreen
    ├── StyleSelectScreen
    ├── DetailSelectScreen
    ├── TradingLevelScreen
    ├── PersonalizingScreen
    └── ReviewPromptScreen
```

---

## State Management (Zustand)

```typescript
interface AppState {
  // Navigation
  currentScreen: string;
  navigationStack: string[];
  showOnboarding: boolean;

  // Onboarding preferences
  experience: 'beginner' | 'intermediate' | 'expert' | null;
  market: string | null;
  style: string | null;
  detail: 'simple' | 'intermediate' | 'advanced' | null;

  // Active analysis
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  capturedImage: string | null;

  // Journal data
  traderScore: number;
  netPL: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  winStreak: number;
  recentTrades: Trade[];

  // Actions
  navigate: (screen: string) => void;
  goBack: () => void;
  setOnboardingComplete: () => void;
  setPreference: (key: string, value: any) => void;
  startAnalysis: () => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setCapturedImage: (image: string) => void;
}
```

---

## Screen Specifications

### SplashScreen

Entry point of the app. Displayed for 2 seconds while app loads.

| Element | Spec |
|---------|------|
| Background | `#000000` full screen |
| Logo | Trend-line-with-arrow icon (Lucide `TrendingUp`), 64px, white, centered |
| Brand name | Not shown — logo only for minimal splash |
| Animation | Fade in 0.3s, hold 1.7s, fade out 0.3s |

---

### LandingScreen

First screen after splash. Welcomes user with tagline and CTA buttons.

| Element | Spec |
|---------|------|
| Background | `#000000` |
| Logo | `TrendingUp` icon + "PROFIT AI" (H3), top-left, 24px from edge |
| Headline | "Your next winning trade starts with a photo." (Display, white) |
| Subheadline | Not shown — headline is self-explanatory |
| CTA Primary | "Continue" (Primary button, full width, bottom area) |
| CTA Secondary | "I have an account" (Secondary button, above primary) |
| Footer | "Privacy Policy | Terms of Use" (Caption, `#8E8E93`, underlined) |
| Layout | Vertical stack, headline takes 40% of screen, buttons at bottom |
| Animation | Headline fades in + translateY(20→0), 0.5s, delay 0.2s. Buttons fade in, delay 0.5s |

---

### OnboardingFeaturesScreen

Shows key features before onboarding questions.

| Element | Spec |
|---------|------|
| Headline | "Transform your trading journey!" (H2) |
| Feature list | 5 items in a Card component, each with: |
| | - Icon in colored circle (left) |
| | - Feature title (H4, right of icon) |
| | 1. 📸 "Snap & Analyze Instantly" |
| | 2. 📈 "Understand Key Market Trends" |
| | 3. 🚀 "Get Actionable Insights" |
| | 4. 🧠 "Define Your Own Strategy" |
| | 5. ⭐ "Start Trading Like a Pro" |
| CTA | "Continue" (Primary button, bottom) |
| Animation | Features stagger in from bottom, 0.1s delay each |

---

### ExperienceSelectScreen

Onboarding question 1: trading experience level.

| Element | Spec |
|---------|------|
| Header | Back arrow (top-left), progress indicator (thin bar, 1/4 filled) |
| Headline | "What's your trading experience?" (H2) |
| Options | 3 selectable cards: |
| | "Beginner 🐣" — card with emoji, `#1C1C1E` bg |
| | "Intermediate 🧠" |
| | "Expert 🚀" |
| Selection | Selected card gets `#2C2C2E` bg + `#FFFFFF` border |
| CTA | "Continue" (Primary button, disabled until selection) |
| Skip | "Not sure yet" (Caption, `#8E8E93`, below CTA) |

---

### MarketSelectScreen

Onboarding question 2: preferred market.

| Element | Spec |
|---------|------|
| Header | Back arrow, progress bar (2/4) |
| Headline | "Which market do you primarily trade in?" (H2) |
| Options | 6 selectable rows: "Stocks 🏦", "Crypto 🔗", "Forex 💵", "Options 📜", "Futures ⏳", "Other" |
| Selection | Same card selection pattern |
| CTA | "Continue" (Primary button) |

---

### StyleSelectScreen

Onboarding question 3: trading style.

| Element | Spec |
|---------|------|
| Header | Back arrow, progress bar (3/4) |
| Headline | "What's your trading style?" (H2) |
| Options | 4 cards with descriptions: |
| | "Scalping ⚡ — Very short-term trades, minutes to hours" |
| | "Day Trading 🌅 — Buying and selling within the same day" |
| | "Swing Trading 🎯 — Holding position for days or weeks" |
| | "Long-Term Investing ⏳ — Holding position for months or years" |
| Selection | Card selection pattern |
| CTA | "Continue" (Primary button) |
| Skip | "Not sure yet" |

---

### DetailSelectScreen

Onboarding question 4: analysis detail level.

| Element | Spec |
|---------|------|
| Header | Back arrow, progress bar (4/4) |
| Headline | "How detailed should the analysis be?" (H2) |
| Options | 3 cards: "Simple 💡", "Intermediate 📖", "Advanced 🚀" |
| Selection | Card selection pattern |
| CTA | "Continue" (Primary button) |

---

### TradingLevelScreen

Summary screen showing value proposition with comparison chart.

| Element | Spec |
|---------|------|
| Header | Back arrow |
| Headline | "You are just few steps away from trading with clarity." (H2) |
| Card | "Your Trading Level" card containing: |
| | - Legend: green dot "Profit AI", red dot "Trading Gurus" |
| | - Mini line chart (Recharts) showing 2 lines: |
| |   - Green line: steady upward curve (Profit AI users) |
| |   - Red line: volatile up-down (Trading Gurus) |
| | - X-axis: Month 1 to Month 2 |
| | - Caption: "Profit AI users read their charts with more confidence and less guesswork." |
| CTA | "Continue" (Primary button) |

---

### PersonalizingScreen

Loading screen while "personalizing" the experience.

| Element | Spec |
|---------|------|
| Background | `#000000` |
| Card | Centered pill-shaped card: `#1C1C1E` bg, border-radius full |
| Text | "Personalizing Profit AI" + LoadingDots |
| Animation | Dots bounce sequentially, card has subtle pulse |
| Duration | Auto-advances after 3 seconds |

---

### HomeScreen (Tab: Home)

Main dashboard showing recent analysis or empty state.

**With Analysis State:**

| Element | Spec |
|---------|------|
| Header | "📈 PROFIT AI" logo + info + bookmark icons |
| Chart Preview | Card with uploaded chart image, full-width, 200px height, border-radius 16px |
| Asset Tag | "Asset" label + pill "XAUUSD (Gold Spot)" (bg `#2C2C2E`, border-radius full) |
| Strategy Tag | "Strategy" label + pill "Auto" |
| Section Title | "Key Insights" (H3) |
| Insights Grid | 4 InsightCards in 2x2: Trend/Neutral, Signal/Hold, Risk Level/Medium, Volume/Medium |
| Section Title | "Active Strategy" (H3) |
| Strategy Card | StrategyCard component: "Trend Pullback (20/50 EMA)", Status: "Not Ideal", 2 orange + 2 gray dots |
| Bottom Fade | `linear-gradient(transparent, #000000)` over bottom 100px to suggest more content |

**Empty State:**

| Element | Spec |
|---------|------|
| Headline | "Snap a chart to get started" (H2, `#8E8E93`) |
| Subtext | "Take a photo of your trading chart and let our AI analyze it" (Body, `#636366`) |
| CTA | "Analyze Chart" button (Primary) |

| Animation | Chart preview slides in from bottom, insights stagger in 0.1s each |

---

### AnalysisDetailScreen

Full detailed analysis view (scrollable).

| Element | Spec |
|---------|------|
| Header | Back arrow + "Analysis" title |
| Chart Preview | Full-width chart image, 240px height |
| Key Insights | 2x2 InsightCards grid |
| Active Strategy | StrategyCard, expandable |
| Overview Section | SectionAccordion: "Overview" — detailed text about market conditions |
| SL and TP Section | SectionAccordion: "SL and TP" — Stop-Loss $4,100, Take-Profit $4,148 in pills |
| Game Plan Section | SectionAccordion: "Game Plan" — Entry & Exit Strategy content |
| Scroll | Full vertical scroll, 60px bottom padding for safe area |

---

### SLTPDetailScreen

Detailed Stop-Loss and Take-Profit view.

| Element | Spec |
|---------|------|
| Header | Back arrow + "SL and TP" title (H3) |
| SL Card | Card: "Stop-Loss" label left, "$4,100" pill right (red bg `rgba(255, 59, 48, 0.15)`, red text) |
| TP Card | Card: "Take-Profit" label left, "$4,148" pill right (green bg `rgba(52, 199, 89, 0.15)`, green text) |
| Reasoning Section | Card with "Reasoning" (H4) + paragraph text (BodySmall, `#8E8E93`) |
| Note Section | Card with "Note" (H4) + disclaimer text |
| Animation | Cards slide in from bottom with 0.1s stagger |

---

### GamePlanDetailScreen

Complete trading game plan with expandable sections.

| Element | Spec |
|---------|------|
| Header | Back arrow + "Game Plan" title (H3) |
| Overview | SectionAccordion with market analysis text |
| Entry & Exit Strategy | SectionAccordion with detailed entry/exit rules |
| Risk & Reward Assessment | SectionAccordion with R:R analysis |
| Trade Duration & Monitoring | SectionAccordion with timeframes |
| Technical Indicators | SectionAccordion: "EMAs are not visible on the screenshot..." |
| Recognized Patterns | SectionAccordion: "No clean classical pattern..." |
| Market Sentiment | SectionAccordion: "Short-term intraday view..." |
| Additional Details | Card: Support Level $4,110, Resistance Level $4,132 |
| Scroll | Full vertical scroll |

---

### AIBrainScreen (Tab: AI Brain)

AI assistant interface for asking trading questions.

| Element | Spec |
|---------|------|
| Header | "AI Brain" title (H3) + brain icon |
| Chat Area | Scrollable message list |
| | AI messages: left-aligned, `#1C1C1E` bg card |
| | User messages: right-aligned, `#007AFF` bg |
| Input Area | Fixed bottom: text input + send button |
| Quick Prompts | Horizontal scroll of pill buttons: "Analyze EURUSD", "Best setup?", "Risk check" |
| Empty State | AI avatar (purple glow) + "Ask me anything about your trades" |

---

### AnalyzeScreen (Tab: Camera)

Camera/file upload interface for chart analysis.

| Element | Spec |
|---------|------|
| Header | X button (close) + "Analyze Asset" title (centered) |
| Preview Area | Full-screen camera preview or uploaded image |
| | If image uploaded: chart image with corner bracket overlay (white L-shapes at corners) |
| Controls | Bottom bar: Gallery icon (left), Shutter button (center, 72px white circle), Flash icon (right) |
| Bottom CTA | "Continue" (Primary button, shown after image selected) |
| Overlay Text | "Just snap a picture of your chart" (H2, white, top area) |
| Animation | Shutter button scales on tap, image preview zooms in slightly |

**After Upload Flow:**
1. User selects/uploads chart image
2. Screen transitions to AnalyzingScreen
3. After 2-3 seconds, transitions to HomeScreen with analysis results

---

### AnalyzingScreen

Loading state during AI analysis.

| Element | Spec |
|---------|------|
| Background | `#000000` |
| Card | Centered pill card: `#1C1C1E` bg |
| Text | "Analyzing Chart" + LoadingDots |
| Progress | Optional: thin progress bar below card, animates width 0→100% over 2.5s |
| Animation | Card fades in, dots bounce, auto-advances after analysis complete |

---

### MarketsScreen (Tab: Markets)

Market overview with trending assets.

| Element | Spec |
|---------|------|
| Header | "Markets" title (H3) |
| Search Bar | Input with Search icon, "Search assets..." placeholder |
| Category Tabs | Horizontal scroll: "All", "Crypto", "Forex", "Stocks", "Commodities" |
| Asset List | Vertical list of AssetRow components |
| AssetRow | Icon/abbreviation left, name + price center, change % right (green/red) |
| | "BTC — Bitcoin — $67,432.21 — +2.34%" |
| Pull-to-refresh | Supported |

---

### ProfileScreen (Tab: Profile)

User profile and app settings.

| Element | Spec |
|---------|------|
| Header | "Profile" title (H3) |
| User Card | Avatar (generated, 64px) + username + email |
| Settings Groups | Cards with grouped settings: |
| | **Account**: Edit Profile, Trading Preferences, Notifications |
| | **App**: Theme (Dark/Light/Auto), Language, Sound Effects |
| | **Support**: Help Center, Contact Us, Rate App |
| | **Legal**: Privacy Policy, Terms of Service |
| Settings Row | Icon left, label center, chevron right |
| Sign Out | "Sign Out" text button (red, `#FF3B30`) at bottom |

---

### JournalScreen (Pushed from Profile or Tab variant)

Trading journal dashboard with performance metrics.

| Element | Spec |
|---------|------|
| Header | "Journal" title + info icon + plus icon (add trade) |
| Tabs | "Dashboard" | "Calendar" | "Trades" (segmented control) |
| Trader Score | Large circular score: "83/100", "Elite Trader" label, green gradient circle |
| Performance Title | "Performance" (H3) + "All time" dropdown |
| Stats Grid | 2x2 + 1 row: |
| | Net P/L: "$150,017" (green dot, large) |
| | Win Rate: "63%" |
| | Total Trades: "49" |
| | Profit Factor: "3.36" |
| | Win Streak: "11 Days" |
| Recent Trades | Section title + "Show All >" link |
| | TradeRow: Date, Asset, P/L, Result (win/loss badge) |
| Animation | Score circle draws with SVG stroke animation, numbers count up |

---

### ReviewPromptScreen

App store review request (shown after successful analysis).

| Element | Spec |
|---------|------|
| Headline | "Help Profit AI grow!" (H2) |
| Subtext | "Help us improve by leaving a review on the app store." (Body, `#8E8E93`) |
| Heart Icon | Large animated heart (❤️) in center, 80px, subtle pulse animation |
| CTA | "Continue" (Primary button) |
| Skip | Dismiss on tapping outside or swiping down |

---

## Mock Data

### Analysis Result

```typescript
const mockAnalysisResult = {
  asset: "XAUUSD (Gold Spot)",
  strategy: "Auto",
  chartImage: "/chart-preview.jpg",
  insights: {
    trend: { label: "Trend", value: "Neutral", icon: "minus", color: "orange" },
    signal: { label: "Signal", value: "Hold", icon: "alert-triangle", color: "orange" },
    riskLevel: { label: "Risk Level", value: "Medium", icon: "bar-chart-2", color: "orange" },
    volume: { label: "Volume", value: "Medium", icon: "activity", color: "purple" }
  },
  activeStrategy: {
    name: "Trend Pullback (20/50 EMA)",
    status: "Not Ideal",
    statusDots: 2, // 2 orange, 2 gray
    overview: "Higher timeframe shows short-term bullish bias (series of higher lows) but the current price is at/near a recent resistance area and there is no visible pullback to 20/50 EMAs or VWAP on the screenshot. RSI and MACD are not visible; no clear oversold reversal candle or bullish engulfing at a moving-average confluence.",
    sl: 4100,
    tp: 4148,
    reasoning: "Stop placed below the recent swing low/support to avoid noise while respecting structure; TP at prior high offers a clear resistance target and reasonable R:R while allowing trailing to capture extended moves.",
    gamePlan: {
      overview: "Current structure favors bulls on short-term swings, but price is at resistance and lacks the required EMA pullback and reversal confirmations for the strategy.",
      entryExit: "Entry: Do NOT enter now. Wait for a pullback to the 20 or 50 EMA (or VWAP) on the intraday timeframe, confirmed by an RSI reversal from oversold and a bullish candle signal near the EMAs.",
      riskReward: "Given current placement near resistance, reward potential for a breakout is moderate but risk of rejection is higher. Target prior highs (~4,148) gives roughly 1.5-2R depending on exact stop.",
      duration: "Day trade: expected hold from minutes to a few hours. Monitor FOC kill zones / major news; if price reaches EMA + reversal, manage actively with 15-30 min checks."
    },
    additional: {
      support: 4110,
      resistance: 4132,
      patterns: "No clean classical pattern; price formed an intraday swing structure with recent small consolidation at resistance (possible micro double-top if rejection continues).",
      sentiment: "Short-term intraday view: price has rallied from the low ~4,096-4,100 area and formed a sequence of higher lows and higher highs. The market is near a horizontal resistance cluster around 4,128-4,132."
    }
  }
};
```

### Journal Data

```typescript
const mockJournalData = {
  traderScore: 83,
  scoreLabel: "Elite Trader",
  netPL: 150017,
  winRate: 63,
  totalTrades: 49,
  profitFactor: 3.36,
  winStreak: 11,
  recentTrades: [
    { id: 1, date: "2024-01-15", asset: "XAUUSD", pl: 2450, result: "win" },
    { id: 2, date: "2024-01-14", asset: "BTCUSD", pl: -890, result: "loss" },
    { id: 3, date: "2024-01-13", asset: "EURUSD", pl: 1200, result: "win" },
    { id: 4, date: "2024-01-12", asset: "XAUUSD", pl: 3400, result: "win" },
    { id: 5, date: "2024-01-11", asset: "AAPL", pl: 567, result: "win" }
  ]
};
```

### Markets Data

```typescript
const mockMarkets = [
  { symbol: "BTC", name: "Bitcoin", price: 67432.21, change: 2.34 },
  { symbol: "ETH", name: "Ethereum", price: 3521.87, change: 1.56 },
  { symbol: "XAU", name: "Gold Spot", price: 4126.68, change: -0.23 },
  { symbol: "EUR", name: "EUR/USD", price: 1.0892, change: 0.12 },
  { symbol: "AAPL", name: "Apple Inc.", price: 195.89, change: 0.87 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.42, change: -1.23 }
];
```

---

## Animation Specifications

| Interaction | Duration | Easing | Properties |
|-------------|----------|--------|------------|
| Page push | 350ms | `cubic-bezier(0.32, 0.72, 0, 1)` | translateX, opacity |
| Page pop | 350ms | `cubic-bezier(0.32, 0.72, 0, 1)` | translateX, opacity |
| Tab switch | 200ms | ease-out | opacity |
| Bottom sheet | 400ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | translateY |
| Card tap | 100ms | ease-in-out | scale(0.98) |
| Button tap | 100ms | ease-in-out | scale(0.96) |
| Accordion expand | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | height, opacity |
| Loading shimmer | 1500ms | linear | background-position |
| Number counter | 1500ms | ease-out | value interpolation |
| Status dots fill | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | background-color, stagger 100ms |
| AI pulse glow | 2000ms | ease-in-out | box-shadow, infinite |
| Score circle draw | 1200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | stroke-dashoffset |
| Stagger children | — | — | 100ms delay between items |

---

## Responsive Notes

The app is designed as a **mobile app simulation** for web:
- Wrapper: `max-width: 430px`, centered, `min-height: 100vh`
- Outer background: `#000000` or subtle dark gradient
- Touch-optimized: all interactive elements ≥ 44px
- Safe area insets respected for notch devices (env(safe-area-inset-*))

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for all text
- Touch targets: 44px minimum
- Focus indicators: 2px outline in `#007AFF`
- Screen reader labels on all icons
- `prefers-reduced-motion`: disable all animations
