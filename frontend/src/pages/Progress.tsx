import { useEffect, useState } from "react";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageHeading from "../components/ui/PageHeading";
import { getProgress } from "../api/progress";
import StatCards from "../components/progress/StatCards";
import ScoreTrendChart from "../components/progress/ScoreTrendChart";
import RecentInterviews from "../components/progress/RecentInterviews";
import EmptyProgress from "../components/progress/EmptyProgress";
import "../components/progress/progress.css";

type Data = Awaited<ReturnType<typeof getProgress>>;
export default function Progress() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const result = await getProgress(controller.signal);
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error && e.message.includes("404") ? "Progress reports aren't available on this backend yet. Please try again later." : "We couldn't load your progress. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [retry]);
  return <main className="progress-page app-sidebar-layout min-h-svh bg-cream-gradient px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]">
    <NavbarDashboard />
    <div className="mx-auto max-w-[1184px] space-y-6 pt-9 max-[700px]:pt-7"><PageHeading eyebrow="YOUR PROGRESS, IN FOCUS" title="Your Progress" subtitle="Look back at your growth, one interview at a time." />
      {loading ? <section className="progress-card py-16 text-center" role="status">Loading your progress…</section> : error ? <section className="progress-card py-12 text-center" role="alert"><p>{error}</p><button type="button" className="mt-5 rounded-xl bg-[#3054ed] px-5 py-3 text-sm text-white" onClick={() => { setLoading(true); setError(null); setRetry(v => v + 1); }}>Try again</button></section> : data && data.summary.total_sessions === 0 ? <EmptyProgress /> : data ? <><StatCards summary={data.summary} /><ScoreTrendChart history={data.history} /><RecentInterviews history={data.history} /></> : null}
    </div>
  </main>;
}
