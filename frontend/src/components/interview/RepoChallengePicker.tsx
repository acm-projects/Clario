import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listRepoChallenges, type RepoChallengeSummary } from "../../api/repoChallenges";
import ProblemLoading from "../ui/ProblemLoading";
import DuckHead from "../layout/DuckHead";
import { useAppearance } from "../../lib/appearance";

type AreaId = "payments" | "scheduling" | "data" | "infra" | "access" | "general";

const AREAS: Record<AreaId, { label: string; icon: string }> = {
  payments: { label: "Payments & commerce", icon: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" },
  scheduling: { label: "Scheduling & time", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  data: { label: "Data pipelines", icon: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" },
  infra: { label: "Infrastructure", icon: "M4 5h16v5H4zM4 14h16v5H4zM8 7.5h.01M8 16.5h.01" },
  access: { label: "Auth & access", icon: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" },
  general: { label: "General", icon: "M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" },
};

const AREA_BY_REPO: Record<string, AreaId> = {
  "account-ledger-01": "payments", "refund-ledger-01": "payments", "daily-revenue-01": "payments",
  "shopping-cart-01": "payments", "inventory-allocation-01": "payments",
  "booking-intervals-01": "scheduling", "job-scheduler-01": "scheduling", "seat-reservations-01": "scheduling", "sensor-window-01": "scheduling",
  "csv-import-01": "data", "event-dedup-01": "data", "transaction-pagination-01": "data", "search-ranking-01": "data",
  "rate-limiter-01": "infra", "route-matcher-01": "infra", "ttl-lru-cache-01": "infra", "webhook-worker-01": "infra",
  "login-debug-01": "access", "permission-roles-01": "access", "feature-rollout-01": "access",
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-[#e3f0e6] text-[#24623f]",
  Medium: "bg-[#fff1cb] text-[#78540c]",
  Hard: "bg-[#fbe9eb] text-[#a72d39]",
};
const LANGUAGE_LABELS: Record<string, string> = { python: "Python", cpp: "C++", javascript: "JavaScript" };

const areaOf = (challenge: RepoChallengeSummary) => AREAS[AREA_BY_REPO[challenge.id] ?? "general"];
const repoName = (id: string) => id.replace(/-\d+$/, "");

function AreaIcon({ path, className = "size-5" }: { path: string; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}

function Chip({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick}
    className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3054ed] ${active ? "border-[#3054ed] bg-[#3054ed] text-white" : "border-[var(--repo-line)] bg-[var(--repo-panel)] text-[var(--text-main)] hover:border-[#3054ed]"}`}>
    {icon && <AreaIcon path={icon} className="size-4" />}
    {children}
  </button>;
}

function ChallengeCard({ challenge }: { challenge: RepoChallengeSummary }) {
  const area = areaOf(challenge);
  return <Link to={`/interview/repo/${encodeURIComponent(challenge.id)}`}
    className="group relative flex flex-col overflow-hidden rounded-[22px] border border-[var(--repo-line)] bg-[var(--repo-panel)] p-6 transition hover:-translate-y-0.5 hover:border-[#3054ed] hover:shadow-[0_22px_44px_-30px_#3054ed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3054ed]">
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#3054ed1a] px-2.5 py-1 text-xs font-medium text-[var(--repo-accent)]">
        <AreaIcon path={area.icon} className="size-3.5" />{area.label}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_STYLES[challenge.difficulty] ?? "bg-[#eef0f4] text-[#4b505c]"}`}>{challenge.difficulty}</span>
    </div>
    <p className="mt-5 flex items-center gap-2 font-mono text-xs text-[var(--repo-muted)]">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#ffdf4f] px-1.5 py-0.5 font-sans font-medium text-[#182137]"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />Open issue</span>
      <span className="truncate">{repoName(challenge.id)}/</span>
    </p>
    <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{challenge.title}</h2>
    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--repo-muted)]">{challenge.description}</p>
    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
      <span className="flex flex-wrap gap-1.5">{challenge.languages.map(language => <span key={language} className="rounded-md border border-[var(--repo-line)] px-2 py-0.5 font-mono text-[var(--repo-muted)]">{LANGUAGE_LABELS[language] ?? language}</span>)}</span>
      <span className="flex shrink-0 items-center gap-3 text-[var(--repo-muted)]">
        <span className="inline-flex items-center gap-1"><AreaIcon path={AREAS.scheduling.icon} className="size-3.5" />~{challenge.estimatedMinutes} min</span>
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-[#3054ed] text-white transition group-hover:translate-x-0.5">&#8594;</span>
      </span>
    </div>
  </Link>;
}

export default function RepoChallengePicker() {
  const [challenges, setChallenges] = useState<RepoChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [area, setArea] = useState<AreaId | "all">("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [query, setQuery] = useState("");
  const theme = useAppearance();

  useEffect(() => {
    const controller = new AbortController();
    listRepoChallenges(controller.signal).then(data => { if (!controller.signal.aborted) { setChallenges(data); setLoading(false); setError(null); } })
      .catch(error => { if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : "Could not load challenges."); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);

  const areasPresent = useMemo(() => (Object.keys(AREAS) as AreaId[]).filter(id => challenges.some(item => (AREA_BY_REPO[item.id] ?? "general") === id)), [challenges]);
  const counts = useMemo(() => Object.fromEntries(DIFFICULTIES.map(level => [level, challenges.filter(item => item.difficulty === level).length])), [challenges]);
  const visible = challenges.filter(item =>
    (area === "all" || (AREA_BY_REPO[item.id] ?? "general") === area) &&
    (difficulty === "all" || item.difficulty === difficulty) &&
    (!query.trim() || `${item.title} ${item.description} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())));

  return <div className="mx-auto max-w-[1240px] px-6 py-8 sm:py-12">
    <Link to="/interview" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--repo-muted)] hover:text-[#3054ed]"><span aria-hidden="true">&#8592;</span>All interview modes</Link>

    <header className="relative mt-4 overflow-hidden rounded-[30px] bg-[#3054ed] p-7 text-white sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-40 size-56 rounded-full bg-[#ffdf4f]/20" />
      <div className="relative flex flex-wrap items-center gap-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15"><DuckHead className="size-12" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-[.18em] text-[#ffdf4f]">READ. REASON. REPAIR.</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Repo Debugging</h1>
          <p className="mt-3 max-w-[620px] text-sm leading-7 text-white/85">Jump into a small, real-world codebase with a reported bug. Trace it, fix it, run the tests and explain your reasoning to the interviewer. No setup needed.</p>
        </div>
      </div>
      {!loading && !error && <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Repositories", String(challenges.length)], ["Easy", String(counts.Easy)], ["Medium", String(counts.Medium)], ["Hard", String(counts.Hard)]].map(([label, value]) =>
          <div key={label} className="rounded-2xl bg-white/12 px-4 py-3"><dt className="text-xs text-white/75">{label}</dt><dd className="mt-1 text-2xl font-semibold">{value}</dd></div>)}
      </dl>}
    </header>

    {loading ? <div className="mt-10"><ProblemLoading dark={theme === "dark"} /></div>
      : error ? <div role="alert" className="mt-10"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1); }} className="mt-4 rounded-xl bg-[#3054ed] px-5 py-3 text-sm text-white">Try again</button></div>
      : <>
        <section aria-label="Filter repositories" className="mt-8 grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <span className="sr-only">Search repositories</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--repo-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search bugs, e.g. refund, cache, calendar"
                className="min-h-11 w-full rounded-full border border-[var(--repo-line)] bg-[var(--repo-panel)] pl-10 pr-4 text-sm text-[var(--text-main)] placeholder:text-[var(--repo-muted)] focus-visible:outline-2 focus-visible:outline-[#3054ed]" />
            </label>
            <div role="group" aria-label="Difficulty" className="flex flex-wrap gap-2">
              <Chip active={difficulty === "all"} onClick={() => setDifficulty("all")}>Any difficulty</Chip>
              {DIFFICULTIES.map(level => <Chip key={level} active={difficulty === level} onClick={() => setDifficulty(level)}>{level}</Chip>)}
            </div>
          </div>
          <div role="group" aria-label="Area" className="flex flex-wrap gap-2">
            <Chip active={area === "all"} onClick={() => setArea("all")}>All areas</Chip>
            {areasPresent.map(id => <Chip key={id} active={area === id} icon={AREAS[id].icon} onClick={() => setArea(id)}>{AREAS[id].label}</Chip>)}
          </div>
        </section>

        <p className="mt-6 text-sm text-[var(--repo-muted)]" aria-live="polite">{visible.length} of {challenges.length} repositories</p>
        {visible.length
          ? <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
          : <div className="mt-4 rounded-[22px] border border-dashed border-[var(--repo-line)] p-10 text-center"><p className="font-medium">No repositories match those filters.</p><button type="button" className="mt-3 text-sm text-[#3054ed] underline" onClick={() => { setArea("all"); setDifficulty("all"); setQuery(""); }}>Clear filters</button></div>}
      </>}
  </div>;
}
