import {
  siAirbnb,
  siCoinbase,
  siDiscord,
  siDoordash,
  siDropbox,
  siDuolingo,
  siGoogle,
  siInstacart,
  siMeta,
  siNetflix,
  siPinterest,
  siReddit,
  siShopify,
  siSpotify,
  siStripe,
  siUber,
  type SimpleIcon,
} from "simple-icons";

export interface DesignCompany {
  /** Must match `company` in system_design_questions for companies with real questions. */
  name: string;
  /** Brand color for the logo tile. */
  color: string;
  /** Text color on the logo tile. */
  ink: string;
  /** Short mark shown when no logo image is set. */
  mark: string;
  /** Brand logo from simple-icons, drawn in `ink` on the `color` tile. Falls back to `mark`. */
  icon?: SimpleIcon;
  /** Optional logo image, e.g. "/logos/bumble.svg" placed in frontend/public/logos. */
  logo?: string;
  tagline: string;
  /**
   * Display-only questions. When set, the company's questions come from here and
   * are not clickable; when absent, real questions load from /api/system-design.
   */
  displayQuestions?: { title: string; difficulty: "easy" | "medium" | "hard" }[];
}

const q = (difficulty: "easy" | "medium" | "hard", title: string) => ({ title, difficulty });

export const DESIGN_COMPANIES: DesignCompany[] = [
  // Real questions with a working voice interview.
  { name: "Bumble", color: "#FFC629", ink: "#1d1d1b", mark: "B", tagline: "Matching, swipes and safety at dating-app scale" },
  { name: "Spotify", icon: siSpotify, color: "#1DB954", ink: "#ffffff", mark: "S", tagline: "Streaming, playlists and personalized discovery" },
  { name: "DoorDash", icon: siDoordash, color: "#FF3008", ink: "#ffffff", mark: "D", tagline: "Real-time logistics across a three-sided marketplace" },
  { name: "Stripe", icon: siStripe, color: "#635BFF", ink: "#ffffff", mark: "S", tagline: "Payments, ledgers and APIs that never double-charge" },
  // Display-only.
  { name: "Netflix", icon: siNetflix, color: "#E50914", ink: "#ffffff", mark: "N", tagline: "Video delivery to hundreds of millions of screens", displayQuestions: [q("hard", "Design a global video streaming CDN"), q("medium", "Rank the personalized home screen rows")] },
  { name: "Uber", icon: siUber, color: "#000000", ink: "#ffffff", mark: "U", tagline: "Real-time mobility and dispatch", displayQuestions: [q("hard", "Match riders with nearby drivers in real time"), q("medium", "Design a surge pricing service")] },
  { name: "Airbnb", icon: siAirbnb, color: "#FF5A5F", ink: "#ffffff", mark: "A", tagline: "A global marketplace for stays", displayQuestions: [q("medium", "Search listings by availability and location"), q("hard", "Prevent double bookings across time zones")] },
  { name: "Google", icon: siGoogle, color: "#4285F4", ink: "#ffffff", mark: "G", tagline: "Search and infrastructure at planet scale", displayQuestions: [q("medium", "Design search autocomplete"), q("easy", "Build a globally distributed URL shortener")] },
  { name: "Meta", icon: siMeta, color: "#0467DF", ink: "#ffffff", mark: "M", tagline: "Social graphs, feeds and messaging", displayQuestions: [q("hard", "Design the news feed"), q("medium", "Deliver read receipts in Messenger")] },
  { name: "Amazon", color: "#FF9900", ink: "#1d1d1b", mark: "a", tagline: "Commerce and fulfillment at peak traffic", displayQuestions: [q("hard", "Keep inventory accurate during Prime Day"), q("medium", "Design the order fulfillment pipeline")] },
  { name: "LinkedIn", color: "#0A66C2", ink: "#ffffff", mark: "in", tagline: "The professional graph", displayQuestions: [q("medium", "Design People You May Know"), q("medium", "Recommend relevant job postings")] },
  { name: "Pinterest", icon: siPinterest, color: "#E60023", ink: "#ffffff", mark: "P", tagline: "Visual discovery and recommendations", displayQuestions: [q("medium", "Design the home feed of pins"), q("hard", "Build visual similarity search")] },
  { name: "Reddit", icon: siReddit, color: "#FF4500", ink: "#ffffff", mark: "R", tagline: "Communities, threads and voting", displayQuestions: [q("medium", "Design nested comment threads with voting"), q("medium", "Compute the Hot ranking at scale")] },
  { name: "Discord", icon: siDiscord, color: "#5865F2", ink: "#ffffff", mark: "D", tagline: "Real-time chat and voice", displayQuestions: [q("hard", "Fan out messages to million-member servers"), q("medium", "Track voice channel presence")] },
  { name: "Slack", color: "#4A154B", ink: "#ffffff", mark: "S", tagline: "Workplace messaging and search", displayQuestions: [q("medium", "Design workspace-wide message search"), q("easy", "Deliver notifications across devices")] },
  { name: "Shopify", icon: siShopify, color: "#5E8E3E", ink: "#ffffff", mark: "S", tagline: "Commerce for millions of storefronts", displayQuestions: [q("hard", "Survive a flash-sale checkout spike"), q("medium", "Isolate tenants in a multi-store platform")] },
  { name: "Dropbox", icon: siDropbox, color: "#0061FF", ink: "#ffffff", mark: "D", tagline: "File sync and storage", displayQuestions: [q("medium", "Sync files across devices"), q("hard", "Deduplicate storage with content-addressed blocks")] },
  { name: "Coinbase", icon: siCoinbase, color: "#0052FF", ink: "#ffffff", mark: "C", tagline: "Exchange and wallet infrastructure", displayQuestions: [q("hard", "Design an order book matching engine"), q("medium", "Keep a consistent wallet ledger")] },
  { name: "Instacart", icon: siInstacart, color: "#43B02A", ink: "#ffffff", mark: "I", tagline: "Same-day grocery delivery", displayQuestions: [q("medium", "Batch orders for shoppers"), q("medium", "Predict real-time item availability")] },
  { name: "Duolingo", icon: siDuolingo, color: "#58CC02", ink: "#ffffff", mark: "D", tagline: "Learning that keeps you coming back", displayQuestions: [q("easy", "Design streaks and weekly leaderboards"), q("medium", "Schedule spaced-repetition lessons")] },
];
