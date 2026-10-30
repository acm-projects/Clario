import { useEffect, useState } from "react";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import DuckHead from "../components/layout/DuckHead";
import { getProgress } from "../api/progress";
import { historyMock, summaryMock, topicsMock, emptySummaryMock } from "../mocks/progressMock";
import StatCards from "../components/progress/StatCards";
import ScoreTrendChart from "../components/progress/ScoreTrendChart";
import TopicBreakdown from "../components/progress/TopicBreakdown";
import UmpireHabits from "../components/progress/UmpireHabits";
import RecentInterviews from "../components/progress/RecentInterviews";
import EmptyProgress from "../components/progress/EmptyProgress";
import "../components/progress/progress.css";

// Real endpoints are the default. Explicit development previews never mask API failures.
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_PROGRESS_USE_MOCK === "true";
type Data = Awaited<ReturnType<typeof getProgress>>;
export default function Progress() {
  const preview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("preview") : null;
  const mock = USE_MOCK || preview === "mock" || preview === "empty";
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const result = mock ? preview === "empty" ? { history: [], summary: emptySummaryMock, topics: { topics: [], weak_topics: [] } } : { history: historyMock, summary: summaryMock, topics: topicsMock } : await getProgress(controller.signal);
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error && e.message.includes("404") ? "Progress reports aren't available on this backend yet. Please try again later." : "We couldn't load your progress. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [retry, mock, preview]);
  return <main className="progress-page app-sidebar-layout min-h-svh bg-cream-gradient px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]">
    <NavbarDashboard />
    <div className="mx-auto max-w-6xl space-y-6"><header className="flex items-center justify-between gap-4 py-4"><div><p className="progress-eyebrow mb-2">A little better, every interview</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your Progress</h1><p className="progress-muted mt-3">Look back at your growth. Find your next focus.</p></div><DuckHead className="w-16 sm:w-24" /></header>
      {mock && <p role="status" className="rounded-xl bg-[#fff1cb] p-3 text-sm text-[#78540c]">Preview data · These are sample interviews.</p>}
      {loading ? <section className="progress-card py-16 text-center" role="status">Loading your progress…</section> : error ? <section className="progress-card py-12 text-center" role="alert"><p>{error}</p><button type="button" className="mt-5 rounded-xl bg-[#3054ed] px-5 py-3 text-sm text-white" onClick={() => { setLoading(true); setError(null); setRetry(v => v + 1); }}>Try again</button></section> : data && data.summary.total_sessions === 0 ? <EmptyProgress /> : data ? <><StatCards summary={data.summary} /><ScoreTrendChart history={data.history} /><div className="grid min-w-0 gap-6 lg:grid-cols-2"><TopicBreakdown topics={data.topics} /><UmpireHabits missRate={data.summary.umpire_miss_rate} /></div><RecentInterviews history={data.history} /></> : null}
    </div>
  </main>;
}
