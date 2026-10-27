import InterviewModeGrid from "../components/interview/InterviewModeGrid";
import PageHeading from "../components/ui/PageHeading";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { loadRecommendedProblem, type DashboardProblem } from "../lib/dashboard";
import { createModeSession, getRandomProblem, getScenario, listScenarios, type Scenario, type ScenarioSummary } from "../lib/api";
import { interviewRoomUrl, modeLabels, parseInterviewMode, type InterviewLaunch, type InterviewMode } from "../lib/interviewModes";
import type { ProfileContext } from "../lib/profile";
import type { Language } from "../types";

const companies = [
  { name: "Airbnb", aliases: ["airbnb"], mark: "A" },
  { name: "Bumble", aliases: ["bumble"], mark: "B" },
  { name: "Spotify", aliases: ["spotify"], mark: "S" },
  { name: "DoorDash", aliases: ["doordash"], mark: "D" },
  { name: "Stripe", aliases: ["stripe"], mark: "S" },
];
const descriptions: Record<InterviewMode, string> = {
  recommended: "Start with a coding problem matched to your starting difficulty. Preview the recommendation, choose Python or Java, and practice explaining your approach.",
  custom: "Choose exactly what you want to practice. Browse the problem library, filter by difficulty or topic, and pick a question for your interview.",
  surprise_me: "Practice tackling an unfamiliar question. Choose your language, then get a random coding problem when you start and work through it out loud.",
  company: "Explore a company-inspired challenge from Bumble, Spotify, DoorDash, or Stripe. Choose a company and scenario, review the prompt, and plan your solution.",
};
export default function InterviewSelection() {
  const { profile } = useOutletContext<ProfileContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = parseInterviewMode(searchParams.get("mode"));
  const candidate = (location.state as { selectedProblem?: DashboardProblem } | null)?.selectedProblem;
  const selectedProblem = candidate && typeof candidate.slug === "string" && typeof candidate.title === "string" ? candidate : null;
  const [language, setLanguage] = useState<Language>(() => profile.preferred_language?.toLowerCase().includes("java") ? "java" : "python3");
  const [recommendation, setRecommendation] = useState<DashboardProblem | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [scenarios, setScenarios] = useState<ScenarioSummary[] | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [company, setCompany] = useState("Bumble");
  const [scenarioSlug, setScenarioSlug] = useState("");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startingRef = useRef(false);
  const detailRef = useRef<HTMLElement>(null);
  const chosenCompany = companies.find(item => item.name === company)!;
  const companyScenarios = (scenarios ?? []).filter(item => chosenCompany.aliases.includes(item.company.toLowerCase().trim()));
  const recommended = mode === "recommended" && selectedProblem ? selectedProblem : recommendation;

  useEffect(() => {
    let active = true;
    loadRecommendedProblem(profile.starting_difficulty ?? "Easy").then(value => {
      if (active) { setRecommendation(value); setRecommendationLoading(false); setRecommendationError(null); }
    }).catch(() => { if (active) { setRecommendationLoading(false); setRecommendationError("We couldn't load your recommendation."); } });
    return () => { active = false; };
  }, [profile.starting_difficulty, retry]);

  useEffect(() => {
    if (mode !== "company") return;
    const controller = new AbortController();
    listScenarios(controller.signal).then(value => {
      if (!controller.signal.aborted) { setScenarios(value); setScenarioError(null); }
    }).catch(() => { if (!controller.signal.aborted) setScenarioError("We couldn't load company scenarios. Please try again."); });
    return () => controller.abort();
  }, [mode, retry]);

  useEffect(() => {
    if (!scenarioSlug || mode !== "company") return;
    const controller = new AbortController();
    getScenario(scenarioSlug, controller.signal).then(value => {
      if (!controller.signal.aborted) { setScenario(value); setScenarioLoading(false); }
    }).catch(() => { if (!controller.signal.aborted) { setPreviewError("We couldn't load this scenario. Choose it again to retry."); setScenarioLoading(false); } });
    return () => controller.abort();
  }, [scenarioSlug, mode]);

  function chooseMode(next: InterviewMode) {
    setStartError(null);
    if (next === "custom") { navigate("/problems?choose=custom"); return; }
    navigate("/interview?mode=" + next);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" }));
  }
  async function start() {
    if (!mode || startingRef.current) return;
    startingRef.current = true; setStarting(true); setStartError(null);
    try {
      let selection: InterviewLaunch;
      let slug: string;
      if (mode === "company") {
        if (!scenario || !companyScenarios.some(item => item.slug === scenario.slug)) throw new Error("Choose a company scenario first.");
        slug = scenario.slug; selection = { mode, scenarioSlug: slug, language };
      } else {
        const problem = mode === "surprise_me" ? await getRandomProblem() : mode === "custom" ? selectedProblem : recommended;
        if (!problem) throw new Error("Choose a question from the problem library first.");
        slug = problem.slug; selection = { mode, problemSlug: slug, language };
      }
      const session = await createModeSession(selection);
      navigate(interviewRoomUrl(slug, session.id, mode));
    } catch (error) { setStartError(error instanceof Error ? error.message : "We couldn't start your interview. Please try again."); }
    finally { startingRef.current = false; setStarting(false); }
  }
  function chooseCompany(value: string) { setCompany(value); setScenarioSlug(""); setScenario(null); setPreviewError(null); setStartError(null); setScenarioLoading(false); }
  function chooseScenario(value: string) { setScenarioSlug(value); setScenario(null); setPreviewError(null); setStartError(null); setScenarioLoading(Boolean(value)); }

  return <main className={"mode-page [&.mode-page]:[background:var(--cream-gradient)] [&.mode-page]:[color:#182137] [&.mode-page]:[font-family:\"DM_Sans\",sans-serif] [&.mode-page_:is(a,button,select):focus-visible]:[outline:2px_solid_#3054ed] [&.mode-page_:is(a,button,select):focus-visible]:[outline-offset:4px] [&.mode-page_button]:[cursor:pointer] [&.mode-page_button:disabled]:[cursor:wait] [&.mode-page_button:disabled]:[opacity:.5] app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] min-h-svh px-4 pb-12 pt-2 sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]"}>
    <NavbarDashboard />
    <div className={"mode-page-content [&.mode-page-content]:[width:100%] [&.mode-page-content]:[max-width:1184px] [&.mode-page-content]:[margin:auto] [&.mode-page-content]:[padding:36px_0_0] [@media_(max-width:760px)]:[&.mode-page-content]:[padding-top:28px] [@media_(max-width:700px)]:[&.mode-page-content]:[padding-top:28px]" + (!mode ? " mode-page-overview [&.mode-page-overview]:[display:flex] [&.mode-page-overview]:[flex-direction:column]  [&.mode-page-overview_.mode-card]:[min-height:270px] [&.mode-page-overview_.mode-card]:[padding:32px] [&.mode-page-overview_.mode-card-title]:[margin:24px_0_12px] [&.mode-page-overview_.mode-card-title]:[font-size:30px] [&.mode-page-overview_.mode-card-title]:[line-height:1.15] [&.mode-page-overview_.mode-card-description]:[max-width:56ch] [&.mode-page-overview_.mode-card-description]:[font-size:14px] [&.mode-page-overview_.mode-card-description]:[line-height:1.8] [&.mode-page-overview_.mode-card-footer]:[padding-top:24px] [&.mode-page-overview_.mode-card-footer]:[font-size:14px] [@media_(max-width:700px)]:[&.mode-page-overview]:[min-height:0] [@media_(max-width:700px)]:[&.mode-page-overview_.mode-card]:[min-height:250px] [@media_(max-width:700px)]:[&.mode-page-overview_.mode-card]:[padding:26px] [@media_(max-width:700px)]:[&.mode-page-overview_.mode-card-title]:[font-size:27px]" : "")}>
      <PageHeading eyebrow="YOUR PRACTICE, YOUR WAY" title={mode ? modeLabels[mode] + " interview" : "Choose your path."} subtitle={mode ? "Review your challenge and choose your language before you start." : "Choose how you want to practice. Select a mode to set up your interview."} />
      {!mode && <InterviewModeGrid descriptions={descriptions} disabled={starting} onChoose={next => next === "repo_debugging" ? navigate("/repo-debugging") : chooseMode(next)} />}
      {mode && <Link className={"mode-back-link [&.mode-back-link]:[display:inline-flex] [&.mode-back-link]:[align-items:center] [&.mode-back-link]:[min-height:44px] [&.mode-back-link]:[color:#3054ed] [&.mode-back-link]:[font-size:14px] [&.mode-back-link:hover]:[text-decoration:underline]"} to="/interview">&#8592; All interview modes</Link>}
      {mode && <section ref={detailRef} className={"mode-detail [&.mode-detail]:[display:grid] [&.mode-detail]:[grid-template-columns:minmax(0,1fr)_280px] [&.mode-detail]:[gap:32px] [&.mode-detail]:[background:#fffdf8] [&.mode-detail]:[border:1px_solid_#e4e2db] [&.mode-detail]:[border-radius:26px] [&.mode-detail]:[padding:34px] [&.mode-detail]:[margin-top:28px] [&.mode-detail]:[scroll-margin-top:24px] [&.mode-detail_h2]:[font-size:32px] [&.mode-detail_h2]:[letter-spacing:-.045em] [&.mode-detail_h2]:[font-weight:500] [&.mode-detail_h2]:[line-height:1.15] [&.mode-detail_h2]:[margin:15px_0] [@media_(max-width:1200px)]:[&.mode-detail]:[grid-template-columns:minmax(0,1fr)_240px] [@media_(max-width:1200px)]:[&.mode-detail]:[padding:26px] [@media_(max-width:1200px)]:[&.mode-detail]:[gap:24px] [@media_(max-width:760px)]:[&.mode-detail]:[grid-template-columns:1fr] [@media_(max-width:440px)]:[&.mode-detail]:[padding:22px] [@media_(max-width:440px)]:[&.mode-detail_h2]:[font-size:28px]"} aria-labelledby="mode-detail-heading"><div className={"mode-detail-main [&.mode-detail-main_>_.reference-eyebrow]:[color:#3054ed] [&.mode-detail-main_>_p:not(.reference-eyebrow)]:[font-size:14px] [&.mode-detail-main_>_p:not(.reference-eyebrow)]:[line-height:1.8] [&.mode-detail-main_>_p:not(.reference-eyebrow)]:[color:#687087]"}><p className={"reference-eyebrow [&.reference-eyebrow]:[font-family:monospace] [&.reference-eyebrow]:[font-size:14px] [&.reference-eyebrow]:[font-weight:600] [&.reference-eyebrow]:[letter-spacing:.13em]"}>{modeLabels[mode].toUpperCase()} MODE</p><h2 id="mode-detail-heading">{mode === "recommended" ? "Your next thoughtful step." : mode === "custom" ? "A question of your choosing." : mode === "company" ? "Think beyond the code." : "A little unexpected. All you."}</h2><p>{descriptions[mode]}</p>
        {mode === "recommended" && <div className={"mode-question-preview [&.mode-question-preview]:[border:1px_solid_#dfe5fa] [&.mode-question-preview]:[border-radius:16px] [&.mode-question-preview]:[background:#f0f3ff] [&.mode-question-preview]:[padding:24px] [&.mode-question-preview]:[margin-top:26px] [&.mode-question-preview_>_span]:[font:14px_monospace] [&.mode-question-preview_>_span]:[color:#3054ed] [&.mode-question-preview_>_span]:[text-transform:uppercase] [&.mode-question-preview_h3]:[font-size:23px] [&.mode-question-preview_h3]:[letter-spacing:-.035em] [&.mode-question-preview_h3]:[font-weight:500] [&.mode-question-preview_h3]:[margin-top:12px] [&.mode-question-preview_p]:[margin-top:10px] [&.mode-question-preview_p]:[font-size:14px] [&.mode-question-preview_p]:[color:#687087] [&.mode-question-preview_p]:[line-height:1.8] [&.mode-question-preview_:is(a,button)]:[display:inline-block] [&.mode-question-preview_:is(a,button)]:[color:#3054ed] [&.mode-question-preview_:is(a,button)]:[text-decoration:underline] [&.mode-question-preview_:is(a,button)]:[font-size:14px] [&.mode-question-preview_:is(a,button)]:[margin-top:16px]"}>{recommendationLoading && !selectedProblem ? <p role="status">Finding your next problem...</p> : recommendationError && !recommended ? <><p role="alert">{recommendationError}</p><button type="button" onClick={() => { setRecommendationLoading(true); setRetry(value => value + 1); }}>Try again</button></> : recommended ? <><span>{recommended.difficulty}</span><h3>{recommended.title}</h3><p>{recommended.topic || "Practice explaining your approach, one step at a time."}</p></> : <p>No recommendation yet. <Link to="/problems?choose=custom">Choose a question from the library.</Link></p>}</div>}
        {mode === "custom" && <div className={"mode-question-preview [&.mode-question-preview]:[border:1px_solid_#dfe5fa] [&.mode-question-preview]:[border-radius:16px] [&.mode-question-preview]:[background:#f0f3ff] [&.mode-question-preview]:[padding:24px] [&.mode-question-preview]:[margin-top:26px] [&.mode-question-preview_>_span]:[font:14px_monospace] [&.mode-question-preview_>_span]:[color:#3054ed] [&.mode-question-preview_>_span]:[text-transform:uppercase] [&.mode-question-preview_h3]:[font-size:23px] [&.mode-question-preview_h3]:[letter-spacing:-.035em] [&.mode-question-preview_h3]:[font-weight:500] [&.mode-question-preview_h3]:[margin-top:12px] [&.mode-question-preview_p]:[margin-top:10px] [&.mode-question-preview_p]:[font-size:14px] [&.mode-question-preview_p]:[color:#687087] [&.mode-question-preview_p]:[line-height:1.8] [&.mode-question-preview_:is(a,button)]:[display:inline-block] [&.mode-question-preview_:is(a,button)]:[color:#3054ed] [&.mode-question-preview_:is(a,button)]:[text-decoration:underline] [&.mode-question-preview_:is(a,button)]:[font-size:14px] [&.mode-question-preview_:is(a,button)]:[margin-top:16px]"}>{selectedProblem ? <><span>{selectedProblem.difficulty}</span><h3>{selectedProblem.title}</h3></> : <p>Pick a question to begin.</p>}<Link to="/problems?choose=custom">{selectedProblem ? "Choose a different question" : "Open problem library"} &#8599;</Link></div>}
        {mode === "surprise_me" && <div className={"mode-surprise-preview [&.mode-surprise-preview]:[display:flex] [&.mode-surprise-preview]:[align-items:center] [&.mode-surprise-preview]:[gap:24px] [&.mode-surprise-preview]:[border-radius:18px] [&.mode-surprise-preview]:[background:#fff3ba] [&.mode-surprise-preview]:[padding:26px] [&.mode-surprise-preview]:[margin-top:26px] [&.mode-surprise-preview_>_span]:[font-size:60px] [&.mode-surprise-preview_>_span]:[font-weight:500] [&.mode-surprise-preview_>_span]:[color:#9b7920] [&.mode-surprise-preview_p]:[font-size:14px] [&.mode-surprise-preview_p]:[line-height:1.9]"}><span aria-hidden="true">?</span><p>A fresh problem is picked when you start.<br />Take a breath, read it through, and talk us through your plan.</p></div>}
        {mode === "company" && <div className={"mode-company-picker [&.mode-company-picker]:[margin-top:26px] [&.mode-company-picker_>_p]:[color:#687087] [&.mode-company-picker_>_p]:[font-size:14px] [&.mode-company-picker_>_p]:[line-height:1.9]"}><div className={"company-buttons [&.company-buttons]:[display:flex] [&.company-buttons]:[flex-wrap:wrap] [&.company-buttons]:[gap:8px] [&.company-buttons]:[margin-bottom:24px] [&.company-buttons_button]:[display:flex] [&.company-buttons_button]:[align-items:center] [&.company-buttons_button]:[gap:8px] [&.company-buttons_button]:[border:1px_solid_#e4e2db] [&.company-buttons_button]:[border-radius:10px] [&.company-buttons_button]:[padding:10px_12px] [&.company-buttons_button]:[font-size:14px] [&.company-buttons_button_>_span]:[font-size:18px] [&.company-buttons_button_>_span]:[font-weight:700] [&.company-buttons_button[aria-pressed=true]]:[color:#3054ed] [&.company-buttons_button[aria-pressed=true]]:[background:#e9edff] [&.company-buttons_button[aria-pressed=true]]:[border-color:#b9c9ff]"} role="group" aria-label="Choose a company">{companies.map(item => <button key={item.name} type="button" aria-pressed={company === item.name} onClick={() => chooseCompany(item.name)}><span aria-hidden="true">{item.mark}</span>{item.name}</button>)}</div>{scenarioError ? <div role="alert"><p>{scenarioError}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : scenarios === null ? <p role="status">Loading company scenarios...</p> : companyScenarios.length ? <label className={"mode-scenario-label [&.mode-scenario-label_select]:[width:100%] [&.mode-scenario-label_select]:[padding:12px] [&.mode-scenario-label_select]:[border:1px_solid_#dedfdc] [&.mode-scenario-label_select]:[background:#fffdf8] [&.mode-scenario-label_select]:[border-radius:10px] [&.mode-scenario-label_select]:[color:#182137] [&.mode-scenario-label]:[display:grid] [&.mode-scenario-label]:[gap:10px] [&.mode-scenario-label]:[font-size:14px]"}>Choose a scenario<select value={scenarioSlug} onChange={event => chooseScenario(event.target.value)}><option value="">Select a scenario</option>{companyScenarios.map(item => <option key={item.slug} value={item.slug}>{item.title} &#8226; {item.difficulty}</option>)}</select></label> : <p className={"mode-empty [&.mode-empty]:[color:#687087] [&.mode-empty]:[font-size:14px] [&.mode-empty]:[line-height:1.9]"}>No scenarios are available for {company} yet. Try another company.</p>}{scenarioLoading && <p role="status">Loading your scenario...</p>}{previewError && <p role="alert">{previewError}</p>}{scenario && <div className={"mode-scenario-preview [&.mode-scenario-preview_>_span]:[font:14px_monospace] [&.mode-scenario-preview_>_span]:[color:#3054ed] [&.mode-scenario-preview_>_span]:[text-transform:uppercase] [&.mode-scenario-preview_h3]:[font-size:23px] [&.mode-scenario-preview_h3]:[letter-spacing:-.035em] [&.mode-scenario-preview_h3]:[font-weight:500] [&.mode-scenario-preview_h3]:[margin-top:12px] [&.mode-scenario-preview]:[margin-top:22px] [&.mode-scenario-preview]:[border-top:1px_solid_#e4e2db] [&.mode-scenario-preview]:[padding-top:22px] [&.mode-scenario-preview_>_div]:[margin-top:16px] [&.mode-scenario-preview_>_div]:[font-size:14px] [&.mode-scenario-preview_>_div]:[line-height:1.9] [&.mode-scenario-preview_>_div]:[white-space:pre-wrap]"}><span>{scenario.difficulty}</span><h3>{scenario.title}</h3><div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(scenario.prompt) }} /></div>}</div>}
      </div><aside className={"mode-start-panel [&.mode-start-panel]:[border-radius:18px] [&.mode-start-panel]:[background:var(--cream-gradient)] [&.mode-start-panel]:[padding:24px] [&.mode-start-panel_>_.reference-eyebrow]:[color:#68778e] [&.mode-start-panel_label]:[display:grid] [&.mode-start-panel_label]:[gap:10px] [&.mode-start-panel_label]:[margin-top:26px] [&.mode-start-panel_label]:[font-size:14px] [&.mode-start-panel_select]:[width:100%] [&.mode-start-panel_select]:[padding:12px] [&.mode-start-panel_select]:[border:1px_solid_#dedfdc] [&.mode-start-panel_select]:[background:#fffdf8] [&.mode-start-panel_select]:[border-radius:10px] [&.mode-start-panel_select]:[color:#182137] [&.mode-start-panel_>_p:not(.reference-eyebrow)]:[font-size:14px] [&.mode-start-panel_>_p:not(.reference-eyebrow)]:[line-height:1.8] [&.mode-start-panel_>_p:not(.reference-eyebrow)]:[color:#687087] [&.mode-start-panel_>_p:not(.reference-eyebrow)]:[margin:22px_0] [&.mode-start-panel_>_a]:[display:block] [&.mode-start-panel_>_a]:[text-align:center] [&.mode-start-panel_>_a]:[margin-top:20px] [&.mode-start-panel_>_a]:[color:#687087] [&.mode-start-panel_>_a]:[text-decoration:underline] [&.mode-start-panel_>_a]:[font-size:14px]"}><p className={"reference-eyebrow [&.reference-eyebrow]:[font-family:monospace] [&.reference-eyebrow]:[font-size:14px] [&.reference-eyebrow]:[font-weight:600] [&.reference-eyebrow]:[letter-spacing:.13em]"}>MAKE IT YOURS</p><label>Interview language<select value={language} onChange={event => setLanguage(event.target.value as Language)} disabled={starting}><option value="python3">Python 3</option><option value="java">Java</option></select></label><p>Say your plan out loud. Leave room for questions. Focus on one clear step at a time.</p><button type="button" className={"mode-start-button [&.mode-start-button]:[display:flex] [&.mode-start-button]:[align-items:center] [&.mode-start-button]:[justify-content:space-between] [&.mode-start-button]:[gap:16px] [&.mode-start-button]:[background:#3054ed] [&.mode-start-button]:[color:white] [&.mode-start-button]:[padding:14px_16px] [&.mode-start-button]:[border-radius:12px] [&.mode-start-button]:[width:100%] [&.mode-start-button]:[font-size:14px] [&.mode-start-button]:[font-weight:600]"} onClick={() => void start()} disabled={starting || (mode === "recommended" && !recommended) || (mode === "custom" && !selectedProblem) || (mode === "company" && !scenario)}>{starting ? "Getting ready..." : "Start interview"}<span aria-hidden="true">&#8594;</span></button><Link to="/interview">Back to all modes</Link></aside></section>}
      {startError && <p className={"mode-start-error [&.mode-start-error]:[background:#fff0d7] [&.mode-start-error]:[border:1px_solid_#ead4ad] [&.mode-start-error]:[color:#76501e] [&.mode-start-error]:[border-radius:14px] [&.mode-start-error]:[padding:20px] [&.mode-start-error]:[font-size:14px] [&.mode-start-error]:[line-height:1.8] [&.mode-start-error]:[margin-top:20px]"} role="alert">{startError}</p>}
    </div>
  </main>;
}
