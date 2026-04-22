import { create } from 'zustand';

export interface Insight {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface AnalysisResult {
  asset: string;
  strategy: string;
  chartImage: string;
  insights: {
    trend: Insight;
    signal: Insight;
    riskLevel: Insight;
    volume: Insight;
  };
  activeStrategy: {
    name: string;
    status: string;
    statusDots: number;
    overview: string;
    sl: number;
    tp: number;
    reasoning: string;
    gamePlan: {
      overview: string;
      entryExit: string;
      riskReward: string;
      duration: string;
    };
    additional: {
      support: number;
      resistance: number;
      patterns: string;
      sentiment: string;
    };
  };
}

export interface Trade {
  id: number;
  date: string;
  asset: string;
  pl: number;
  result: 'win' | 'loss';
}

interface AppState {
  // Navigation
  currentScreen: string;
  prevScreen: string | null;
  activeTab: string;
  showOnboarding: boolean;
  showReviewPrompt: boolean;

  // Onboarding preferences
  experience: string | null;
  market: string[];
  tradingStyle: string | null;
  detailLevel: string | null;

  // Active analysis
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  capturedImage: string | null;
  hasAnalysis: boolean;

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
  setActiveTab: (tab: string) => void;
  setOnboardingComplete: () => void;
  setExperience: (val: string) => void;
  setMarket: (val: string[]) => void;
  setTradingStyle: (val: string) => void;
  setDetailLevel: (val: string) => void;
  startAnalysis: () => void;
  completeAnalysis: () => void;
  setCapturedImage: (image: string) => void;
  dismissReview: () => void;
  resetAnalysis: () => void;
}

export const TAB_SCREENS: Record<string, string> = {
  home: 'HomeScreen',
  'ai-brain': 'AIBrainScreen',
  analyze: 'AnalyzeScreen',
  markets: 'MarketsScreen',
  profile: 'ProfileScreen',
  'gold-analysis': 'GoldAnalysisScreen',
};

const INITIAL_ANALYSIS: AnalysisResult = {
  asset: 'XAUUSD (Gold Spot)',
  strategy: 'Auto',
  chartImage: '/chart-preview.jpg',
  insights: {
    trend: { label: 'Trend', value: 'Neutral', icon: 'minus', color: 'orange' },
    signal: { label: 'Signal', value: 'Hold', icon: 'alert-triangle', color: 'orange' },
    riskLevel: { label: 'Risk Level', value: 'Medium', icon: 'bar-chart-2', color: 'orange' },
    volume: { label: 'Volume', value: 'Medium', icon: 'activity', color: 'purple' },
  },
  activeStrategy: {
    name: 'Trend Pullback (20/50 EMA)',
    status: 'Not Ideal',
    statusDots: 2,
    overview: 'Higher timeframe shows short-term bullish bias (series of higher lows) but the current price is at/near a recent resistance area and there is no visible pullback to 20/50 EMAs or VWAP on the screenshot. RSI and MACD are not visible; no clear oversold reversal candle or bullish engulfing at a moving-average confluence. Volume shows spikes on moves but no reliable confirmation candle at a pullback.',
    sl: 4100,
    tp: 4148,
    reasoning: 'Stop placed below the recent swing low/support to avoid noise while respecting structure; TP at prior high offers a clear resistance target and reasonable R:R while allowing trailing to capture extended moves.',
    gamePlan: {
      overview: 'Current structure favors bulls on short-term swings, but price is at resistance and lacks the required EMA pullback and reversal confirmations for the strategy. Best action is to wait for a clean pullback + candle confirmation or validated breakout.',
      entryExit: 'Entry: Do NOT enter now. Wait for a pullback to the 20 or 50 EMA (or VWAP) on the intraday timeframe, confirmed by an RSI reversal from oversold (on that timeframe) and a bullish candle signal (pin bar, bullish engulfing) near the EMAs. Alternative: wait for a confirmed breakout above 4,132 with increased volume and a retest as support. Exit: take partial profits at prior swing high (~4,148) and trail remaining position by ATR or move SL to breakeven after first target.',
      riskReward: 'Given current placement near resistance, reward potential for a breakout is moderate but risk of rejection is higher. If an entry is taken on a confirmed pullback to the 20/50 EMA or VWAP with RSI reversal, target prior highs (~4,148) gives roughly 1.5-2R depending on exact stop. Without a clear retest, risk/reward is poor.',
      duration: 'Day trade: expected hold from minutes to a few hours. Monitor FOC kill zones / major news; if price reaches EMA + reversal, manage actively with 15-30 min checks and trail by ATR (e.g., 1x-1.5x ATR) after reaching first TP.',
    },
    additional: {
      support: 4110,
      resistance: 4132,
      patterns: 'No clean classical pattern; price formed an intraday swing structure with recent small consolidation at resistance (possible micro double-top if rejection continues).',
      sentiment: 'Short-term intraday view: price has rallied from the low ~4,096-4,100 area and formed a sequence of higher lows and higher highs. The market is near a horizontal resistance cluster around 4,128-4,132. Volume has been higher on directional moves, indicating participation, but the latest candles show small range/indecision near resistance.',
    },
  },
};

export const useStore = create<AppState>((set, get) => ({
  // Navigation
  currentScreen: 'SplashScreen',
  prevScreen: null,
  activeTab: 'home',
  showOnboarding: true,
  showReviewPrompt: false,

  // Onboarding preferences
  experience: null,
  market: [],
  tradingStyle: null,
  detailLevel: null,

  // Active analysis
  isAnalyzing: false,
  analysisResult: null,
  capturedImage: null,
  hasAnalysis: false,

  // Journal data
  traderScore: 83,
  netPL: 150017,
  winRate: 63,
  totalTrades: 49,
  profitFactor: 3.36,
  winStreak: 11,
  recentTrades: [
    { id: 1, date: '2024-01-15', asset: 'XAUUSD', pl: 2450, result: 'win' },
    { id: 2, date: '2024-01-14', asset: 'BTCUSD', pl: -890, result: 'loss' },
    { id: 3, date: '2024-01-13', asset: 'EURUSD', pl: 1200, result: 'win' },
    { id: 4, date: '2024-01-12', asset: 'XAUUSD', pl: 3400, result: 'win' },
    { id: 5, date: '2024-01-11', asset: 'AAPL', pl: 567, result: 'win' },
  ],

  // Actions
  navigate: (screen) => {
    const state = get();
    set({ prevScreen: state.currentScreen, currentScreen: screen });
  },

  goBack: () => {
    const state = get();
    if (state.prevScreen) {
      set({ currentScreen: state.prevScreen, prevScreen: null });
    } else {
      set({ currentScreen: TAB_SCREENS[state.activeTab] || 'HomeScreen' });
    }
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab, currentScreen: TAB_SCREENS[tab], prevScreen: null });
  },

  setOnboardingComplete: () => {
    set({ showOnboarding: false, currentScreen: 'HomeScreen' });
  },

  setExperience: (val) => set({ experience: val }),
  setMarket: (val) => set({ market: val }),
  setTradingStyle: (val) => set({ tradingStyle: val }),
  setDetailLevel: (val) => set({ detailLevel: val }),

  startAnalysis: () => set({ isAnalyzing: true }),

  completeAnalysis: () => {
    set({
      isAnalyzing: false,
      hasAnalysis: true,
      analysisResult: INITIAL_ANALYSIS,
      currentScreen: 'HomeScreen',
      activeTab: 'home',
      showReviewPrompt: true,
    });
  },

  setCapturedImage: (image) => set({ capturedImage: image }),

  dismissReview: () => set({ showReviewPrompt: false }),

  resetAnalysis: () => {
    set({
      analysisResult: null,
      capturedImage: null,
      hasAnalysis: false,
    });
  },
}));
