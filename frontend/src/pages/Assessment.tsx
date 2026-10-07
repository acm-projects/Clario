import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveAssessment, type ProfileContext } from "../lib/profile";
import { getQuestionPath, getPracticeLanguage, initialAnswers, isBeginnerPath, validateQuestion, type OnboardingAnswers, type LanguagesUsed, type PracticeLanguage, type QuestionId } from "../lib/practiceProfile";

const stages = ["Experience", "Language", "Comfort", "Practice goal"];
const stageByQuestion: Record<QuestionId, number> = { leetcode: 0, coding: 0, used: 0, language: 1, languageComfort: 2, interviewConfidence: 2, weekly: 3 };
const choiceStyle = "relative flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-5 text-sm transition motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[#191d20]";
const selectedStyle = "border-[#3b8fe8]/75 bg-[#dfeaf5]/40";
const idleStyle = "border-[#191d20]/10 bg-white/35 hover:border-[#3b8fe8]/40 hover:bg-white/65";

function getQuestion(id: QuestionId, answers: OnboardingAnswers) {
  const beginner = isBeginnerPath(answers);
  switch (id) {
    case "leetcode": return { label: "YOUR EXPERIENCE", title: "Have you used LeetCode before?", description: "We'll use this to choose a better starting point for your practice." };
    case "coding": return { label: "YOUR EXPERIENCE", title: "Have you coded before?", description: "No LeetCode experience is totally fine. We just want to understand your coding background." };
    case "used": return { label: "YOUR EXPERIENCE", title: answers.hasLeetCodeExperience ? "Which language have you used on LeetCode?" : "Which of these have you used?", description: answers.hasLeetCodeExperience ? "Python, Java, both, or a different language?" : "Tell us whether you've worked with Python, Java, both, or neither." };
    case "language": return { label: "YOUR LANGUAGE", title: answers.hasLeetCodeExperience === true && answers.languagesUsed === "other" ? "Which language would you like to practice with?" : beginner ? "Which language would you like to start with?" : "Which language do you want to practice in?", description: beginner ? "Choose a language to begin with. No prior experience needed." : "Choose the language you want to use during your mock interviews." };
    case "languageComfort": return { label: "YOUR COMFORT", title: `How comfortable are you with ${getPracticeLanguage(answers)}?`, description: "Choose what feels right today. We'll use this to set your starting point." };
    case "interviewConfidence": return { label: "YOUR COMFORT", title: "How comfortable do you feel with technical interviews?", description: "Think about explaining your approach, coding out loud, and answering follow-up questions." };
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
      await saveAssessment(supabase, currentAnswers, user.id);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#F6EDD1] font-sans text-[#191d20] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#191d20] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4">
      <header className="relative z-10 px-6 pt-6 md:px-[7%]"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-2xl border border-white/90 bg-white/55 px-6 py-4 shadow-[0_4px_24px_rgba(25,29,32,0.045)] backdrop-blur-xl"><Link to="/" className="text-2xl font-semibold tracking-[-0.07em]" aria-label="Clario home">CLARIO<span className="text-[#3b8fe8]">.</span></Link><span className="font-detail text-[10px] tracking-wider text-[#55595c] sm:text-xs">YOUR PRACTICE PROFILE</span></div></header>
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 gap-12 px-6 pb-36 pt-16 md:px-[7%] lg:grid-cols-[0.65fr_1.35fr] lg:gap-24 lg:pt-24">
        <aside className="lg:pr-8"><p className="mb-6 flex items-center gap-3 font-detail text-[10px] tracking-widest text-[#55595c]"><span className="h-0.5 w-6 bg-[#3b8fe8]" />A LITTLE ABOUT YOU</p><h1 className="max-w-64 text-3xl font-semibold leading-[1.1] tracking-[-0.045em] lg:text-4xl">Let&apos;s find your starting point.</h1><p className="mt-8 hidden max-w-64 text-[13px] leading-6 text-[#55595c] lg:block">A few quick questions will help us personalize your practice.</p><ol className="mt-16 hidden space-y-8 lg:block" aria-label="Assessment stages">{stages.map((label, number) => <li key={label} aria-current={stage === number ? "step" : undefined} className={`flex items-center gap-4 text-xs ${stage === number ? "font-semibold text-[#191d20]" : "text-[#191d20]/40"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full font-detail text-[10px] ${stage === number ? "bg-[#dfeaf5]/70 text-[#2f7fe2]" : "text-[#191d20]/35"}`}>0{number + 1}</span>{label}</li>)}</ol></aside>
        <section className="min-w-0 self-start" aria-labelledby="assessment-question">
          <p className="mb-6 font-detail text-[10px] text-[#55595c]">QUESTION {index + 1} / {path.length}</p>
          <div role="progressbar" aria-label="Progress on your assessment path" aria-valuemin={0} aria-valuemax={path.length} aria-valuenow={index} className="mb-14 h-1 overflow-hidden rounded-full bg-[#191d20]/10"><div className="h-full bg-[#3b8fe8] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${index / path.length * 100}%` }} /></div>
          <form onSubmit={submit} aria-busy={saving}><fieldset disabled={saving} className="min-w-0"><legend className="sr-only">{question.title}</legend><p className="mb-6 font-detail text-[11px] tracking-wider text-[#55595c]">{question.label}</p><h2 id="assessment-question" ref={headingRef} tabIndex={-1} className="max-w-[680px] text-[clamp(30px,3.2vw,48px)] font-semibold leading-[1.12] tracking-[-0.045em] outline-none">{question.title}</h2><p className="mt-6 max-w-[520px] text-[13px] leading-6 text-[#191d20]/60">{question.description}</p>
            {(questionId === "leetcode" || questionId === "coding") && <div className="mt-10 grid grid-cols-2 gap-4">{[true, false].map((value) => <Choice key={String(value)} name={questionId} selected={(questionId === "leetcode" ? answers.hasLeetCodeExperience : answers.hasCodingExperience) === value} label={value ? "Yes" : "No"} onSelect={() => update(questionId === "leetcode" ? { hasLeetCodeExperience: value } : { hasCodingExperience: value })} />)}</div>}
            {questionId === "used" && <div className="mt-10 grid grid-cols-2 gap-4">{(["Python", "Java", "both", answers.hasLeetCodeExperience ? "other" : "neither"] as LanguagesUsed[]).map((value) => <Choice key={value} name="languages-used" selected={answers.languagesUsed === value} label={value === "both" ? "Both" : value === "neither" ? "Neither" : value === "other" ? "Other" : value} onSelect={() => update({ languagesUsed: value })} />)}</div>}
            {questionId === "language" && <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">{(["Python", "Java"] as const).map((value) => <Choice key={value} name="practice-language" selected={answers.selectedLanguage === value} label={value} recommended={beginner && value === "Python"} description={beginner ? value === "Python" ? "Beginner-friendly syntax and great for learning technical interview patterns." : "More structured and commonly used in technical courses and interviews." : undefined} onSelect={() => update({ selectedLanguage: value })} />)}</div>}
            {questionId === "languageComfort" && language && <ComfortSlider value={comfortByLanguage[language]} onChange={(value) => { setComfortByLanguage((current) => ({ ...current, [language]: value })); setError(""); }} name="language-comfort" left="Just getting started" right="Very confident" />}
            {questionId === "interviewConfidence" && <ComfortSlider value={confidence} onChange={setConfidence} name="interview-confidence" left="Completely new to this" right="Ready to try one" />}
            {questionId === "weekly" && <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-5">{[1, 2, 3, 4, 5].map((value) => <Choice key={value} name="weekly-goal" selected={answers.weeklyInterviewGoal === value} label={value === 5 ? "5+" : String(value)} onSelect={() => update({ weeklyInterviewGoal: value })} />)}</div>}
          </fieldset>{error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="mt-14 flex flex-wrap items-center gap-4"><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-[#3b8fe8] px-6 py-3 text-sm font-semibold text-[#121826] transition hover:bg-[#6eaff8] disabled:opacity-60 motion-reduce:transition-none">{saving ? "Saving..." : isLast ? "Finish & open dashboard" : "Continue"}<span aria-hidden="true">&#8594;</span></button>{index > 0 && <button type="button" disabled={saving} onClick={() => { setError(""); setQuestionId(path[index - 1]); }} className="px-4 py-3 text-sm text-[#55595c] hover:text-[#191d20] disabled:opacity-60">Back</button>}</div></form>
        </section>
      </div><AssessmentWaves />
    </main>
  );
}

function Choice({ name, selected, label, onSelect, description, recommended = false }: { name: string; selected: boolean; label: string; onSelect: () => void; description?: string; recommended?: boolean }) {
  return <label className={`${choiceStyle} ${selected ? selectedStyle : idleStyle}`}><input type="radio" name={name} value={label} checked={selected} onChange={onSelect} className="sr-only" /><span className="flex-1"><span className="flex flex-wrap items-center gap-2 font-medium">{label}{recommended && <span className="rounded bg-[#dfeaf5]/70 px-2 py-1 font-detail text-[8px] tracking-wider text-[#2f7fe2]">RECOMMENDED</span>}</span>{description && <span className="mt-3 block text-xs leading-6 text-[#55595c]">{description}</span>}</span><span aria-hidden="true" className={`w-3 text-[#2f7fe2] ${selected ? "visible" : "invisible"}`}>&#10003;</span></label>;
}

function ComfortSlider({ value, onChange, name, left, right }: { value: number; onChange: (value: number) => void; name: string; left: string; right: string }) {
  return <div className="mt-12 max-w-[608px]"><div className="mb-6 flex items-baseline gap-2"><output htmlFor={name} className="text-4xl font-semibold tracking-tight text-[#191d20]">{value}</output><span className="font-detail text-xs text-[#55595c]">/ 10</span></div><input id={name} type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-labelledby="assessment-question" aria-valuetext={`${value} out of 10`} className="h-8 w-full cursor-pointer accent-[#3b8fe8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#191d20]" /><div className="mt-4 flex justify-between gap-4 text-xs text-[#55595c]"><span>0 / {left}</span><span className="text-right">10 / {right}</span></div></div>;
}

function AssessmentWaves() {
  return <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 overflow-hidden sm:h-24" aria-hidden="true"><svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="h-full w-full motion-reduce:hidden"><defs><path id="assessment-wave" d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V160 H0Z" /></defs><g fill="#6eaff8"><use href="#assessment-wave" /><use href="#assessment-wave" x="1440" /><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="22s" repeatCount="indefinite" /></g><g transform="translate(0 32)"><g fill="#2d82ea"><use href="#assessment-wave" /><use href="#assessment-wave" x="1440" /><animateTransform attributeName="transform" type="translate" from="-1440 0" to="0 0" dur="15s" repeatCount="indefinite" /></g></g></svg><svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="hidden h-full w-full motion-reduce:block"><path d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V160 H0Z" fill="#6eaff8" /><path d="M0 96 Q180 32 360 96 T720 96 T1080 96 T1440 96 V160 H0Z" fill="#2d82ea" /></svg></div>;
}






