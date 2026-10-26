import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { supabase } from "../lib/supabase";
import { getProfileUpdate, saveAssessment, type ProfileContext } from "../lib/profile";
import { getQuestionPath, getPracticeLanguage, initialAnswers, isBeginnerPath, validateQuestion, type OnboardingAnswers, type LanguagesUsed, type PracticeLanguage, type QuestionId, topicOptions } from "../lib/practiceProfile";

const stages = ["Experience", "Language", "Comfort", "Practice goal", "Interview prep"];
const stageByQuestion: Record<QuestionId, number> = { leetcode: 0, coding: 0, used: 0, language: 1, languageComfort: 2, interviewConfidence: 2, weekly: 3, strugglingTopics: 4, targetCompany: 4, interviewDate: 4 };
const choiceStyle = "assessment-choice [transition:background_180ms_ease,_border-color_180ms_ease,_box-shadow_180ms_ease] [&:has(input:checked)]:[box-shadow:0_0_0_1px_#3b8fe840] [@media_(prefers-reduced-motion:_reduce)]:transition-none relative flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-5 text-sm transition motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[#182137]";
const selectedStyle = "border-[#3054ed]/75 bg-[#e9edff] shadow-[0_0_0_1px_#3b8fe830]";
const idleStyle = "border-[#182137]/10 bg-white/75 hover:border-[#3054ed]/40 hover:bg-white";

function getQuestion(id: QuestionId, answers: OnboardingAnswers) {
  const beginner = isBeginnerPath(answers);
  switch (id) {
    case "leetcode": return { label: "YOUR EXPERIENCE", title: "Have you used LeetCode before?", description: "We'll use this to choose a better starting point for your practice." };
    case "coding": return { label: "YOUR EXPERIENCE", title: "Have you coded before?", description: "No LeetCode experience is totally fine. We just want to understand your coding background." };
    case "used": return { label: "YOUR EXPERIENCE", title: answers.hasLeetCodeExperience ? "Which language have you used on LeetCode?" : "Which of these have you used?", description: answers.hasLeetCodeExperience ? "Python, Java, both, or a different language?" : "Tell us whether you've worked with Python, Java, both, or neither." };
    case "language": return { label: "YOUR LANGUAGE", title: answers.hasLeetCodeExperience === true && answers.languagesUsed === "other" ? "Which language would you like to practice with?" : beginner ? "Which language would you like to start with?" : "Which language do you want to practice in?", description: beginner ? "Choose a language to begin with. No prior experience needed." : "Choose the language you want to use during your mock interviews." };
    case "languageComfort": return { label: "YOUR COMFORT", title: `How comfortable are you with ${getPracticeLanguage(answers)}?`, description: "Choose what feels right today. We'll use this to set your starting point." };
    case "interviewConfidence": return { label: "YOUR COMFORT", title: "How comfortable do you feel with technical interviews?", description: "Think about explaining your approach, coding out loud, and answering follow-up questions." };
    case "strugglingTopics": return { label: "YOUR FOCUS", title: "What topics do you struggle with?", description: "Select any topics you want to practice. You can leave this blank if you're unsure." };
    case "targetCompany": return { label: "YOUR GOAL", title: "What companies are you preparing for?", description: "Optional: enter a company or companies, separated by commas." };
    case "interviewDate": return { label: "YOUR TIMELINE", title: "When is your next interview?", description: "Optional: choose a date if you have an interview scheduled." };
    case "weekly": return { label: "YOUR PRACTICE GOAL", title: answers.hasCodingExperience === false && answers.hasLeetCodeExperience === false ? "How many mock interviews do you want to work toward each week?" : "How many mock interviews do you want to complete per week?", description: beginner ? "Start small. You can always increase your goal later." : "Choose a goal that feels realistic. You can change this later." };
  }
}

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useOutletContext<ProfileContext>();
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [questionId, setQuestionId] = useState<QuestionId>("leetcode");
  const [comfortByLanguage, setComfortByLanguage] = useState<Record<PracticeLanguage, number>>({ Python: 5, Java: 5 });
  const [confidence, setConfidence] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savingRef = useRef(false);
  const path = getQuestionPath(answers);
  const index = path.indexOf(questionId);
  const stage = stageByQuestion[questionId];
  const question = getQuestion(questionId, answers);
  const language = getPracticeLanguage(answers);
  const isLast = index === path.length - 1;
  const beginner = isBeginnerPath(answers);

  useEffect(() => { headingRef.current?.focus(); }, [questionId]);

  function update(patch: Partial<OnboardingAnswers>) {
    setAnswers((current) => ({ ...current, ...patch }));
    setError("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingRef.current) return;
    const currentAnswers = {
      ...answers,
      languageComfort: questionId === "languageComfort" && language ? comfortByLanguage[language] : answers.languageComfort,
      interviewConfidence: questionId === "interviewConfidence" ? confidence : answers.interviewConfidence,
    };
    const validation = validateQuestion(questionId, currentAnswers);
    if (validation) { setError(validation); return; }
    setAnswers(currentAnswers);
    setError("");
    const currentPath = getQuestionPath(currentAnswers);
    const next = currentPath[currentPath.indexOf(questionId) + 1];
    if (next) { setQuestionId(next); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true") {
        // Test answers stay in this browser tab rather than updating the real account.
        sessionStorage.setItem(`clario:dev-profile:${user.id}`, JSON.stringify(getProfileUpdate(currentAnswers)));
      } else {
        await saveAssessment(supabase, currentAnswers, user.id);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <main className={"assessment-page [&.assessment-page]:[background:#f3f1eb] [&.assessment-page]:[color:#182137] [&.assessment-page]:[font-family:\"DM_Sans\",sans-serif] [&.assessment-page_:is(a,button,select):focus-visible]:[outline:2px_solid_#3054ed] [&.assessment-page_:is(a,button,select):focus-visible]:[outline-offset:4px] [&.assessment-page_.assessment-layout]:[max-width:1184px] [&.assessment-page_.assessment-layout]:[gap:28px] [&.assessment-page_.assessment-layout]:[grid-template-columns:minmax(0,.8fr)_minmax(0,1.7fr)] [&.assessment-page_.assessment-intro]:[background:linear-gradient(150deg,#3054ed,#263dae)] [&.assessment-page_.assessment-intro]:[color:white] [&.assessment-page_.assessment-intro]:[padding:32px] [&.assessment-page_.assessment-intro]:[border-radius:26px] [&.assessment-page_.assessment-intro_h1]:[max-width:100%] [&.assessment-page_.assessment-intro_h1]:[font-size:36px] [&.assessment-page_.assessment-intro_h1]:[letter-spacing:-.05em] [&.assessment-page_.assessment-intro_h1]:[line-height:1.08] [&.assessment-page_.assessment-intro_>_p]:[color:#dce3ff] [&.assessment-page_.assessment-intro_>_p]:[font-size:12px] [&.assessment-page_.assessment-intro_>_p:first-child]:[font:10px_monospace] [&.assessment-page_.assessment-intro_>_p:first-child]:[letter-spacing:.13em] [&.assessment-page_.assessment-stages]:[display:grid] [&.assessment-page_.assessment-stages]:[grid-template-columns:1fr] [&.assessment-page_.assessment-stages]:[gap:20px] [&.assessment-page_.assessment-stages]:[padding-top:26px] [&.assessment-page_.assessment-stages]:[border-top:1px_solid_#ffffff25] [&.assessment-page_.assessment-stages_li]:[color:#c0ceff] [&.assessment-page_.assessment-stages_li]:[font-size:12px] [&.assessment-page_.assessment-stages_li[aria-current=step]]:[color:white] [&.assessment-page_.assessment-stages_li_>_span]:[background:#ffffff15] [&.assessment-page_.assessment-stages_li_>_span]:[color:#c0ceff] [&.assessment-page_.assessment-stages_li_>_span]:[width:32px] [&.assessment-page_.assessment-stages_li_>_span]:[height:32px] [&.assessment-page_.assessment-stages_li_>_span]:[border-radius:10px] [&.assessment-page_.assessment-stages_li[aria-current=step]_>_span]:[background:#ffdf4f] [&.assessment-page_.assessment-stages_li[aria-current=step]_>_span]:[color:#182137] [&.assessment-page_.assessment-question-card]:[border-radius:26px] [&.assessment-page_.assessment-question-card]:[padding:36px] [&.assessment-page_.assessment-question-card]:[box-shadow:0_12px_32px_-24px_#18213730] [&.assessment-page_#assessment-question]:[font-size:clamp(28px,3vw,40px)] [&.assessment-page_#assessment-question]:[font-weight:500] [&.assessment-page_#assessment-question]:[letter-spacing:-.045em] [&.assessment-page_.assessment-choice]:[border-radius:16px] [&.assessment-page_.assessment-question-body_>_div:last-child_>_button:first-child]:[border-radius:12px] [&.assessment-page_.assessment-question-card_>_p:first-child]:[font:10px_monospace] [&.assessment-page_.assessment-question-card_>_p:first-child]:[letter-spacing:.1em] [@media_(max-width:760px)]:[&.assessment-page_.assessment-layout]:[grid-template-columns:1fr] [@media_(max-width:760px)]:[&.assessment-page_.assessment-intro]:[padding:26px] [@media_(max-width:760px)]:[&.assessment-page_.assessment-intro_h1]:[font-size:32px] [@media_(max-width:760px)]:[&.assessment-page_.assessment-stages]:[grid-template-columns:repeat(2,minmax(0,1fr))] [@media_(max-width:760px)]:[&.assessment-page_.assessment-question-card]:[padding:26px] [@media_(max-width:440px)]:[&.assessment-page_.assessment-question-card]:[padding:22px] [@media_(max-width:440px)]:[&.assessment-page_.assessment-choice]:[padding:18px_14px] app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] relative isolate flex min-h-svh flex-col bg-[var(--page-background)] px-4 pt-2 font-sans text-[#182137] sm:px-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#3054ed]"}>
      <NavbarDashboard />
      <div className="assessment-layout relative z-10 mx-auto grid w-full max-w-[1200px] flex-1 items-start gap-10 py-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-12 lg:py-14">
        <aside className="assessment-intro lg:pr-4"><p className="mb-6 flex items-center gap-3 font-detail text-[14px] tracking-widest text-[#687087]"><span className="h-0.5 w-6 bg-[#3054ed]" />A LITTLE ABOUT YOU</p><h1 className="max-w-64 text-3xl font-semibold leading-[1.1] tracking-[-0.045em] lg:text-4xl">Let&apos;s find your starting point.</h1><p className="mt-8 hidden max-w-64 text-[14px] leading-6 text-[#687087] lg:block">A few quick questions will help us personalize your practice.</p><ol className={"assessment-stages [&_li[aria-current=\"step\"]]:[color:#3054ed] mt-8 grid grid-cols-2 gap-4 lg:grid-cols-1"} aria-label="Assessment stages">{stages.map((label, number) => <li key={label} aria-current={stage === number ? "step" : undefined} className={`flex items-center gap-4 text-xs ${stage === number ? "font-semibold text-[#182137]" : "text-[#182137]/40"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full font-detail text-[14px] ${stage === number ? "bg-[#dfeaf5]/70 text-[#3054ed]" : "text-[#182137]/35"}`}>{number < stage ? "\u2713" : `0${number + 1}`}</span>{label}</li>)}</ol></aside>
        <section className="assessment-question-card min-w-0 self-start rounded-[20px] border border-[#e4e2db] bg-[#fffdf8] p-6 shadow-[0_10px_32px_-24px_#12354c40] sm:p-8 lg:p-10" aria-labelledby="assessment-question">
          <p className="mb-6 font-detail text-[14px] text-[#687087]">QUESTION {index + 1} / {path.length}</p>
          <div role="progressbar" aria-label="Progress on your assessment path" aria-valuemin={0} aria-valuemax={path.length} aria-valuenow={index} className="mb-8 h-1 overflow-hidden rounded-full bg-[#182137]/10"><div className="h-full bg-[#3054ed] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${index / path.length * 100}%` }} /></div>
          <form key={questionId} className="assessment-question-body [animation:assessment-reveal_240ms_ease-out_both] [@media_(prefers-reduced-motion:_reduce)]:animate-none" onSubmit={submit} aria-busy={saving}><fieldset disabled={saving} className="min-w-0"><legend className="sr-only">{question.title}</legend><p className="mb-6 font-detail text-[14px] tracking-wider text-[#687087]">{question.label}</p><h2 id="assessment-question" ref={headingRef} tabIndex={-1} className="max-w-[680px] text-[clamp(30px,3.2vw,48px)] font-semibold leading-[1.12] tracking-[-0.045em] outline-none">{question.title}</h2><p className="mt-6 max-w-[520px] text-[14px] leading-6 text-[#182137]/60">{question.description}</p>
            {(questionId === "leetcode" || questionId === "coding") && <div className="mt-10 grid grid-cols-2 gap-4">{[true, false].map((value) => <Choice key={String(value)} name={questionId} selected={(questionId === "leetcode" ? answers.hasLeetCodeExperience : answers.hasCodingExperience) === value} label={value ? "Yes" : "No"} onSelect={() => update(questionId === "leetcode" ? { hasLeetCodeExperience: value } : { hasCodingExperience: value })} />)}</div>}
            {questionId === "used" && <div className="mt-10 grid grid-cols-2 gap-4">{(["Python", "Java", "both", answers.hasLeetCodeExperience ? "other" : "neither"] as LanguagesUsed[]).map((value) => <Choice key={value} name="languages-used" selected={answers.languagesUsed === value} label={value === "both" ? "Both" : value === "neither" ? "Neither" : value === "other" ? "Other" : value} onSelect={() => update({ languagesUsed: value })} />)}</div>}
            {questionId === "language" && <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">{(["Python", "Java"] as const).map((value) => <Choice key={value} name="practice-language" selected={answers.selectedLanguage === value} label={value} recommended={beginner && value === "Python"} description={beginner ? value === "Python" ? "Beginner-friendly syntax and great for learning technical interview patterns." : "More structured and commonly used in technical courses and interviews." : undefined} onSelect={() => update({ selectedLanguage: value })} />)}</div>}
            {questionId === "languageComfort" && language && <ComfortSlider value={comfortByLanguage[language]} onChange={(value) => { setComfortByLanguage((current) => ({ ...current, [language]: value })); setError(""); }} name="language-comfort" left="Just getting started" right="Very confident" />}
            {questionId === "interviewConfidence" && <ComfortSlider value={confidence} onChange={setConfidence} name="interview-confidence" left="Completely new to this" right="Ready to try one" />}
            {questionId === "strugglingTopics" && <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">{topicOptions.map(topic => <label key={topic} className={`${choiceStyle} ${answers.strugglingTopics.includes(topic) ? selectedStyle : idleStyle}`}><input type="checkbox" checked={answers.strugglingTopics.includes(topic)} onChange={event => update({ strugglingTopics: event.target.checked ? [...answers.strugglingTopics, topic] : answers.strugglingTopics.filter(value => value !== topic) })} className="accent-[#3054ed]" /><span>{topic}</span></label>)}</div>}
            {questionId === "targetCompany" && <div className="mt-10"><label htmlFor="target-company" className="mb-3 block text-sm">Companies (optional)</label><input id="target-company" type="text" value={answers.targetCompany} onChange={event => update({ targetCompany: event.target.value })} placeholder="e.g. Google, Microsoft" className="min-h-12 w-full rounded-xl border border-[#182137]/20 bg-white px-4 text-sm" /></div>}
            {questionId === "interviewDate" && <div className="mt-10"><label htmlFor="interview-date" className="mb-3 block text-sm">Interview date (optional)</label><input id="interview-date" type="date" value={answers.interviewDate} onChange={event => update({ interviewDate: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#182137]/20 bg-white px-4 text-sm sm:max-w-xs" /></div>}
            {questionId === "weekly" && <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-5">{[1, 2, 3, 4, 5].map((value) => <Choice key={value} name="weekly-goal" selected={answers.weeklyInterviewGoal === value} label={value === 5 ? "5+" : String(value)} onSelect={() => update({ weeklyInterviewGoal: value })} />)}</div>}
          </fieldset>{error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="mt-14 flex flex-wrap items-center gap-4"><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-[#3054ed] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2543ca] disabled:opacity-60 motion-reduce:transition-none">{saving ? "Saving..." : isLast ? "Finish & open dashboard" : "Continue"}<span aria-hidden="true">&#8594;</span></button>{index > 0 && <button type="button" disabled={saving} onClick={() => { setError(""); setQuestionId(path[index - 1]); }} className="px-4 py-3 text-sm text-[#687087] hover:text-[#182137] disabled:opacity-60">Back</button>}</div></form>
        </section>
      </div>
    </main>
  );
}

function Choice({ name, selected, label, onSelect, description, recommended = false }: { name: string; selected: boolean; label: string; onSelect: () => void; description?: string; recommended?: boolean }) {
  return <label className={`${choiceStyle} ${selected ? selectedStyle : idleStyle}`}><input type="radio" name={name} value={label} checked={selected} onChange={onSelect} className="sr-only" /><span className="flex-1"><span className="flex flex-wrap items-center gap-2 font-medium">{label}{recommended && <span className="rounded bg-[#dfeaf5]/70 px-2 py-1 font-detail text-[14px] tracking-wider text-[#3054ed]">RECOMMENDED</span>}</span>{description && <span className="mt-3 block text-xs leading-6 text-[#687087]">{description}</span>}</span><span aria-hidden="true" className={`w-3 text-[#3054ed] ${selected ? "visible" : "invisible"}`}>&#10003;</span></label>;
}

function ComfortSlider({ value, onChange, name, left, right }: { value: number; onChange: (value: number) => void; name: string; left: string; right: string }) {
  return <div className="mt-12 max-w-[608px]"><div className="mb-6 flex flex-wrap items-baseline gap-2" aria-live="polite"><output htmlFor={name} className="text-4xl font-semibold tracking-tight text-[#182137]">{value}</output><span className="font-detail text-xs text-[#687087]">/ 10</span><span className="ml-auto rounded-full bg-[#e9edff] px-3 py-1.5 text-xs text-[#2946c5]">{value <= 3 ? "Building foundations" : value <= 7 ? "Finding your rhythm" : "Ready for a challenge"}</span></div><input id={name} type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-labelledby="assessment-question" aria-valuetext={`${value} out of 10`} className="h-8 w-full cursor-pointer accent-[#3054ed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#182137]" /><div className="mt-4 flex justify-between gap-4 text-xs text-[#687087]"><span>0 / {left}</span><span className="text-right">10 / {right}</span></div></div>;
}
