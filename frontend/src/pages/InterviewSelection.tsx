import PondLife from "../components/effects/PondLife";
import TextType from "../components/effects/TextType";
import DecryptedText from "../components/effects/DecryptedText";
import WaterWaves from "../components/effects/WaterWaves";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { loadRecommendedProblem, type DashboardProblem } from "../lib/dashboard";
import type { ProblemSummary } from "../lib/problems";
import { fakeProblem } from "../types";
import type { ProfileContext } from "../lib/profile";

// Literal Tailwind utilities keep page styling beside its markup.
const interviewStyles = [
  // &
  `[&]:[position:relative] [&]:[isolation:isolate] [&]:[overflow-x:clip] [&]:[font-family:var(--font-sans)] [&]:[background:#f7f4e9] [&]:[overflow:clip]`,
  // &::before
  `[&::before]:[content:none] [&::before]:[position:absolute] [&::before]:[z-index:-1] [&::before]:[inset:0] [&::before]:[pointer-events:none] [&::before]:[background:none]`,
  // & .interview-path-heading
  `[&_.interview-path-heading]:[animation:none] [&_.interview-path-heading]:[margin-bottom:24px] [&_.interview-path-heading]:[padding-right:80px] [&_.interview-path-heading]:[min-height:112px]`,
  // & .interview-path-options
  `[&_.interview-path-options]:[display:grid] [&_.interview-path-options]:[grid-template-columns:repeat(2,minmax(0,1fr))] [&_.interview-path-options]:[gap:18px] [&_.interview-path-options]:[align-items:stretch]`,
  // & .interview-path-card
  `[&_.interview-path-card]:[position:relative] [&_.interview-path-card]:[display:flex] [&_.interview-path-card]:[flex-direction:column] [&_.interview-path-card]:[min-width:0] [&_.interview-path-card]:[padding-top:22px] [&_.interview-path-card]:[padding-right:22px] [&_.interview-path-card]:[padding-bottom:22px] [&_.interview-path-card]:[padding-left:22px] [&_.interview-path-card]:[border:1px_solid_rgb(214_225_236_/_.8)] [&_.interview-path-card]:[border-radius:24px] [&_.interview-path-card]:[background:rgb(255_255_255_/_.9)] [&_.interview-path-card]:[backdrop-filter:blur(8px)] [&_.interview-path-card]:[box-shadow:0_4px_16px_-10px_rgb(13_48_99_/_.2)] [&_.interview-path-card]:[transition:border-color_.2s_ease,box-shadow_.2s_ease] [&_.interview-path-card]:[animation:none] [&_.interview-path-card]:[color:#182137] [&_.interview-path-card]:[isolation:isolate] [&_.interview-path-card]:[overflow:hidden]`,
  // & .interview-path-card:nth-child(2)
  `[&_.interview-path-card:nth-child(2)]:[animation-delay:.22s]`,
  // & .interview-path-card:hover
  `[&_.interview-path-card:hover]:[transform:none] [&_.interview-path-card:hover]:[box-shadow:0_6px_20px_-12px_rgb(13_48_99_/_.25)] [&_.interview-path-card:hover]:[border-color:#c4d5e6]`,
  // & .interview-path-card[data-selected="true"]
  `[&_.interview-path-card[data-selected="true"][data-selected="true"]]:[border-color:#3054ed] [&_.interview-path-card[data-selected="true"][data-selected="true"]]:[box-shadow:0_0_0_1px_#3054ed22,0_8px_28px_-18px_#18213730]`,
  // & .interview-path-selector
  `[&_.interview-path-selector]:[display:block] [&_.interview-path-selector]:[width:100%] [&_.interview-path-selector]:[text-align:left] [&_.interview-path-selector]:[cursor:pointer] [&_.interview-path-selector]:[border-radius:18px] [&_.interview-path-selector]:[padding-right:28px]`,
  // & .interview-path-selector h2
  `[&_.interview-path-selector_h2]:[margin-top:14px] [&_.interview-path-selector_h2]:[font-size:22px] [&_.interview-path-selector_h2]:[font-weight:600] [&_.interview-path-selector_h2]:[letter-spacing:-.035em] [&_.interview-path-selector_h2]:[text-decoration:none] [&_.interview-path-selector_h2]:[text-decoration-color:#8ab9ee] [&_.interview-path-selector_h2]:[text-underline-offset:9px] [&_.interview-path-selector_h2]:[text-decoration-thickness:2px]`,
  // & .interview-path-icon
  `[&_.interview-path-icon]:[display:grid] [&_.interview-path-icon]:[place-items:center] [&_.interview-path-icon]:[width:40px] [&_.interview-path-icon]:[height:40px] [&_.interview-path-icon]:[border:1px_solid_white] [&_.interview-path-icon]:[border-radius:12px] [&_.interview-path-icon]:[background:#eef0ff] [&_.interview-path-icon]:[color:#3054ed] [&_.interview-path-icon]:[box-shadow:none] [&_.interview-path-icon]:[transition:none] [&_.interview-path-icon]:[border-color:#dbe8f1]`,
  // & .interview-path-icon svg
  `[&_.interview-path-icon_svg]:[width:21px] [&_.interview-path-icon_svg]:[height:21px]`,
  // & .interview-path-card:hover .interview-path-icon
  `[&_.interview-path-card:hover_.interview-path-icon]:[transform:none] [&_.interview-path-card:hover_.interview-path-icon]:[box-shadow:none]`,
  // & .interview-path-check
  `[&_.interview-path-check]:[position:absolute] [&_.interview-path-check]:[top:26px] [&_.interview-path-check]:[right:22px] [&_.interview-path-check]:[display:grid] [&_.interview-path-check]:[place-items:center] [&_.interview-path-check]:[width:20px] [&_.interview-path-check]:[height:20px] [&_.interview-path-check]:[border:1px_solid_#aac4df] [&_.interview-path-check]:[border-radius:50%] [&_.interview-path-check]:[font-size:12px] [&_.interview-path-check]:[transition:background_.25s_ease,transform_.25s_ease]`,
  // & .interview-path-card[data-selected="true"] .interview-path-check
  `[&_.interview-path-card[data-selected="true"][data-selected="true"]_.interview-path-check]:[background:#3054ed] [&_.interview-path-card[data-selected="true"][data-selected="true"]_.interview-path-check]:[border-color:#3054ed] [&_.interview-path-card[data-selected="true"][data-selected="true"]_.interview-path-check]:[color:white] [&_.interview-path-card[data-selected="true"][data-selected="true"]_.interview-path-check]:[animation:none]`,
  // & .interview-path-description
  `[&_.interview-path-description]:[margin-top:12px] [&_.interview-path-description]:[color:#58627b] [&_.interview-path-description]:[font-size:13px] [&_.interview-path-description]:[line-height:1.65]`,
  // & .interview-path-benefits
  `[&_.interview-path-benefits]:[display:grid] [&_.interview-path-benefits]:[gap:8px] [&_.interview-path-benefits]:[margin-top:18px] [&_.interview-path-benefits]:[margin-right:0] [&_.interview-path-benefits]:[margin-bottom:18px] [&_.interview-path-benefits]:[margin-left:0] [&_.interview-path-benefits]:[color:#58627b] [&_.interview-path-benefits]:[font-size:12px] [&_.interview-path-benefits]:[line-height:1.7]`,
  // & .interview-path-benefits li
  `[&_.interview-path-benefits_li]:[display:flex] [&_.interview-path-benefits_li]:[align-items:baseline] [&_.interview-path-benefits_li]:[gap:12px]`,
  // & .interview-path-benefits li::before
  `[&_.interview-path-benefits_li::before]:[content:""] [&_.interview-path-benefits_li::before]:[width:6px] [&_.interview-path-benefits_li::before]:[height:6px] [&_.interview-path-benefits_li::before]:[flex-shrink:0] [&_.interview-path-benefits_li::before]:[border-radius:50%] [&_.interview-path-benefits_li::before]:[background:#3054ed]`,
  // & .interview-practice-problem
  `[&_.interview-practice-problem]:[padding-top:16px] [&_.interview-practice-problem]:[padding-right:16px] [&_.interview-practice-problem]:[padding-bottom:16px] [&_.interview-practice-problem]:[padding-left:16px] [&_.interview-practice-problem]:[border:1px_solid_#acd1f7] [&_.interview-practice-problem]:[border-radius:12px] [&_.interview-practice-problem]:[background:#fff3bb] [&_.interview-practice-problem]:[transition:box-shadow_.3s_ease] [&_.interview-practice-problem]:[margin-bottom:20px] [&_.interview-practice-problem]:[border-color:#e0e8f0]`,
  // & .interview-practice-problem:hover
  `[&_.interview-practice-problem:hover]:[box-shadow:none]`,
  // & .interview-practice-problem a:hover
  `[&_.interview-practice-problem_a:hover]:[text-decoration:underline] [&_.interview-practice-problem_a:hover]:[text-underline-offset:4px]`,
  // & .interview-path-start
  `[&_.interview-path-start]:[display:flex] [&_.interview-path-start]:[align-items:center] [&_.interview-path-start]:[justify-content:space-between] [&_.interview-path-start]:[width:100%] [&_.interview-path-start]:[min-height:44px] [&_.interview-path-start]:[margin-top:auto] [&_.interview-path-start]:[padding-top:11px] [&_.interview-path-start]:[padding-right:18px] [&_.interview-path-start]:[padding-bottom:11px] [&_.interview-path-start]:[padding-left:18px] [&_.interview-path-start]:[border-radius:10px] [&_.interview-path-start]:[background:#3054ed] [&_.interview-path-start]:[color:white] [&_.interview-path-start]:[font-size:13px] [&_.interview-path-start]:[font-weight:600] [&_.interview-path-start]:[cursor:pointer] [&_.interview-path-start]:[transition:background_.25s_ease,transform_.25s_ease,box-shadow_.25s_ease]`,
  // & .interview-practice-problem + .interview-path-start
  `[&_.interview-practice-problem_+_.interview-path-start]:[margin-top:auto]`,
  // & .interview-path-start:hover:not(:disabled)
  `[&_.interview-path-start:hover:not(:disabled)]:[background:#2543ca] [&_.interview-path-start:hover:not(:disabled)]:[transform:none] [&_.interview-path-start:hover:not(:disabled)]:[box-shadow:none]`,
  // & .interview-path-start span
  `[&_.interview-path-start_span]:[transition:transform_.25s_ease]`,
  // & .interview-path-start:hover span
  `[&_.interview-path-start:hover_span]:[transform:translateX(4px)]`,
  // & .interview-path-start:disabled
  `[&_.interview-path-start:disabled]:[cursor:not-allowed] [&_.interview-path-start:disabled]:[opacity:.5]`,
  // & .interview-mock-visual
  `[&_.interview-mock-visual]:[position:relative] [&_.interview-mock-visual]:[display:grid] [&_.interview-mock-visual]:[place-items:center] [&_.interview-mock-visual]:[flex:1] [&_.interview-mock-visual]:[min-height:180px] [&_.interview-mock-visual]:[margin-bottom:28px] [&_.interview-mock-visual]:[overflow:hidden] [&_.interview-mock-visual]:[border-radius:22px] [&_.interview-mock-visual]:[background:radial-gradient(ellipse,#dcecff88,transparent_70%)]`,
  // & .interview-clock
  `[&_.interview-clock]:[display:flex] [&_.interview-clock]:[flex-direction:column] [&_.interview-clock]:[align-items:center] [&_.interview-clock]:[gap:10px] [&_.interview-clock]:[color:#3054ed] [&_.interview-clock]:[animation:interview-clock-float_5s_ease-in-out_infinite]`,
  // & .interview-clock svg
  `[&_.interview-clock_svg]:[width:86px] [&_.interview-clock_svg]:[height:86px]`,
  // & .interview-clock span
  `[&_.interview-clock_span]:[font-size:11px] [&_.interview-clock_span]:[letter-spacing:.1em]`,
  // & .interview-mock-visual i
  `[&_.interview-mock-visual_i]:[position:absolute] [&_.interview-mock-visual_i]:[width:5px] [&_.interview-mock-visual_i]:[height:5px] [&_.interview-mock-visual_i]:[border-radius:50%] [&_.interview-mock-visual_i]:[background:#7eb6ee] [&_.interview-mock-visual_i]:[left:20%] [&_.interview-mock-visual_i]:[top:35%] [&_.interview-mock-visual_i]:[animation:interview-clock-float_3s_ease-in-out_infinite]`,
  // & .interview-mock-visual i:nth-of-type(2)
  `[&_.interview-mock-visual_i:nth-of-type(2)]:[left:75%] [&_.interview-mock-visual_i:nth-of-type(2)]:[top:60%] [&_.interview-mock-visual_i:nth-of-type(2)]:[animation-delay:-1s]`,
  // & .interview-mock-visual i:nth-of-type(3)
  `[&_.interview-mock-visual_i:nth-of-type(3)]:[left:65%] [&_.interview-mock-visual_i:nth-of-type(3)]:[top:15%] [&_.interview-mock-visual_i:nth-of-type(3)]:[animation-delay:-2s]`,
  // (max-width:767px) ? & .interview-path-options
  `[@media_(max-width:767px)]:[&_.interview-path-options]:[grid-template-columns:minmax(0,1fr)] [@media_(max-width:767px)]:[&_.interview-path-options]:[gap:14px]`,
  // (max-width:767px) ? & .interview-path-card
  `[@media_(max-width:767px)]:[&_.interview-path-card]:[padding-top:18px] [@media_(max-width:767px)]:[&_.interview-path-card]:[padding-right:18px] [@media_(max-width:767px)]:[&_.interview-path-card]:[padding-bottom:18px] [@media_(max-width:767px)]:[&_.interview-path-card]:[padding-left:18px] [@media_(max-width:767px)]:[&_.interview-path-card]:[border-radius:20px]`,
  // (max-width:767px) ? & .interview-path-check
  `[@media_(max-width:767px)]:[&_.interview-path-check]:[top:22px] [@media_(max-width:767px)]:[&_.interview-path-check]:[right:18px]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-heading
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-heading]:[animation:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-card
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-card]:[animation:none] [@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-card]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-clock
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-clock]:[animation:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-mock-visual i
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-mock-visual_i]:[animation:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-card[data-selected="true"] .interview-path-check
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-card[data-selected="true"][data-selected="true"]_.interview-path-check]:[animation:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-icon
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-icon]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-check
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-check]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-practice-problem
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-practice-problem]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-start
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-start]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-start span
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-start_span]:[transition:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-card:hover
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-card:hover]:[transform:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-card:hover .interview-path-icon
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-card:hover_.interview-path-icon]:[transform:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-start:hover:not(:disabled)
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-start:hover:not(:disabled)]:[transform:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-path-start:hover span
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-path-start:hover_span]:[transform:none]`,
  // & .interview-path-shell
  `[&_.interview-path-shell]:[padding-top:28px] [&_.interview-path-shell]:[padding-bottom:130px] [&_.interview-path-shell]:[position:relative] [&_.interview-path-shell]:[z-index:1]`,
  // & .interview-path-heading h1
  `[&_.interview-path-heading_h1]:[font-size:clamp(26px,2.6vw,36px)] [&_.interview-path-heading_h1]:[line-height:1.2] [&_.interview-path-heading_h1]:[margin-top:18px] [&_.interview-path-heading_h1]:[min-height:1.2em]`,
  // & .interview-path-heading > p:last-child
  `[&_.interview-path-heading_>_p:last-child]:[margin-top:8px] [&_.interview-path-heading_>_p:last-child]:[font-size:13px] [&_.interview-path-heading_>_p:last-child]:[line-height:1.65] [&_.interview-path-heading_>_p:last-child]:[color:#687087]`,
  // & .interview-practice-problem h3
  `[&_.interview-practice-problem_h3]:[margin-top:8px] [&_.interview-practice-problem_h3]:[font-size:16px]`,
  // & .interview-practice-problem a
  `[&_.interview-practice-problem_a]:[margin-top:8px] [&_.interview-practice-problem_a]:[min-height:36px] [&_.interview-practice-problem_a]:[font-size:12px]`,
  // &::after
  `[&::after]:[content:none] [&::after]:[background:none]`,
  // & .interview-sun
  `[&_.interview-sun]:[position:absolute] [&_.interview-sun]:[z-index:2] [&_.interview-sun]:[top:-100px] [&_.interview-sun]:[right:-100px] [&_.interview-sun]:[width:260px] [&_.interview-sun]:[height:260px] [&_.interview-sun]:[pointer-events:none]`,
  // & .interview-sun-art
  `[&_.interview-sun-art]:[display:block] [&_.interview-sun-art]:[width:100%] [&_.interview-sun-art]:[height:100%] [&_.interview-sun-art]:[overflow:visible]`,
  // & .interview-sun-art svg
  `[&_.interview-sun-art_svg]:[display:block] [&_.interview-sun-art_svg]:[width:100%] [&_.interview-sun-art_svg]:[height:100%] [&_.interview-sun-art_svg]:[overflow:visible]`,
  // & .interview-sun-art[data-shining="true"] .interview-sun-rays
  `[&_.interview-sun-art[data-shining="true"]_.interview-sun-rays]:[transform-origin:100px_100px] [&_.interview-sun-art[data-shining="true"]_.interview-sun-rays]:[animation:interview-sun-shine_.65s_ease-out]`,
  // & .interview-sunbeam
  `[&_.interview-sunbeam]:[position:absolute] [&_.interview-sunbeam]:[inset:0] [&_.interview-sunbeam]:[z-index:0] [&_.interview-sunbeam]:[width:100%] [&_.interview-sunbeam]:[height:100%] [&_.interview-sunbeam]:[overflow:hidden] [&_.interview-sunbeam]:[pointer-events:none]`,
  // & .interview-sunbeam polygon
  `[&_.interview-sunbeam_polygon]:[fill:#E5D7AF] [&_.interview-sunbeam_polygon]:[opacity:.48] [&_.interview-sunbeam_polygon]:[animation:interview-beam-arrive_.45s_ease-out_both]`,
  // & .interview-footer-waves
  `[&_.interview-footer-waves]:[position:relative] [&_.interview-footer-waves]:[left:-1rem] [&_.interview-footer-waves]:[width:calc(100%_+_2rem)] [&_.interview-footer-waves]:[height:80px] [&_.interview-footer-waves]:[flex-shrink:0] [&_.interview-footer-waves]:[margin-top:auto] [&_.interview-footer-waves]:[overflow:hidden] [&_.interview-footer-waves]:[pointer-events:none] [&_.interview-footer-waves]:[background:#f7f4e9] [&_.interview-footer-waves]:[display:none]`,
  // (min-width:640px) ? & .interview-footer-waves
  `[@media_(min-width:640px)]:[&_.interview-footer-waves]:[left:-1.5rem] [@media_(min-width:640px)]:[&_.interview-footer-waves]:[width:calc(100%_+_3rem)] [@media_(min-width:640px)]:[&_.interview-footer-waves]:[height:96px]`,
  // (min-width:1024px) ? & .interview-footer-waves
  `[@media_(min-width:1024px)]:[&_.interview-footer-waves]:[left:calc(-1_*_(var(--sidebar-width)_+_48px))] [@media_(min-width:1024px)]:[&_.interview-footer-waves]:[width:calc(100%_+_var(--sidebar-width)_+_80px)]`,
  // (max-width:767px) ? & .interview-sun
  `[@media_(max-width:767px)]:[&_.interview-sun]:[top:-78px] [@media_(max-width:767px)]:[&_.interview-sun]:[right:-78px] [@media_(max-width:767px)]:[&_.interview-sun]:[width:210px] [@media_(max-width:767px)]:[&_.interview-sun]:[height:210px]`,
  // (max-width:767px) ? & .interview-path-heading
  `[@media_(max-width:767px)]:[&_.interview-path-heading]:[padding-right:45px]`,
  // (prefers-reduced-motion:reduce) ? & .interview-sun-art[data-shining="true"] .interview-sun-rays
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-sun-art[data-shining="true"]_.interview-sun-rays]:[animation:none]`,
  // (prefers-reduced-motion:reduce) ? & .interview-sunbeam polygon
  `[@media_(prefers-reduced-motion:reduce)]:[&_.interview-sunbeam_polygon]:[animation:none]`,
  // & .interview-encrypted-letter
  `[&_.interview-encrypted-letter]:[color:#89949b]`,
  // & .interview-pond
  `[&_.interview-pond]:[position:absolute] [&_.interview-pond]:[z-index:0] [&_.interview-pond]:[top:48%] [&_.interview-pond]:[bottom:0] [&_.interview-pond]:[left:0] [&_.interview-pond]:[right:0] [&_.interview-pond]:[background:linear-gradient(var(--water),var(--water-deep))] [&_.interview-pond]:[pointer-events:none]`,
  // & .interview-pond-waves
  `[&_.interview-pond-waves]:[position:absolute] [&_.interview-pond-waves]:[top:-100px] [&_.interview-pond-waves]:[width:100%] [&_.interview-pond-waves]:[height:102px]`,
  // & .interview-pond .pond-duck
  `[&_.interview-pond_.pond-duck]:[top:auto] [&_.interview-pond_.pond-duck]:[bottom:24px]`,
  // & .interview-pond .pond-computer
  `[&_.interview-pond_.pond-computer]:[top:auto] [&_.interview-pond_.pond-computer]:[bottom:42px]`,
].join(" ");

type SelectedProblem = Pick<ProblemSummary, "slug" | "title" | "difficulty">;
type InterviewMode = "practice" | "mock";

export default function InterviewSelection() {
  const { profile } = useOutletContext<ProfileContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const candidate = (location.state as { selectedProblem?: SelectedProblem } | null)?.selectedProblem;
  const selectedProblem = candidate && typeof candidate.slug === "string" && candidate.slug.trim() && typeof candidate.title === "string" && ["Easy", "Medium", "Hard"].includes(candidate.difficulty) ? candidate : null;
  const pageRef = useRef<HTMLElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLElement>(null);
  const mockRef = useRef<HTMLElement>(null);
  const [beam, setBeam] = useState("");
  const [sunshine, setSunshine] = useState(0);
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [recommendation, setRecommendation] = useState<DashboardProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationError, setRecommendationError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [starting, setStarting] = useState<InterviewMode | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const startingRef = useRef(false);
  const practiceProblem = selectedProblem || recommendation;

  useEffect(() => {
    let active = true;
    async function load() {
    setLoading(true);
    setRecommendationError(false);
    setRecommendation(null);
    await loadRecommendedProblem(profile.starting_difficulty).then(data => {
      if (active) setRecommendation(data);
    }).catch(() => {
      if (active) setRecommendationError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    }
    void load();
    return () => { active = false; };
  }, [profile.starting_difficulty, retry]);

  useEffect(() => {
    const page = pageRef.current;
    const sun = sunRef.current;
    const card = mode === "practice" ? practiceRef.current : mockRef.current;
    if (!page || !sun || !card) return;
    function measure() {
      if (!page || !sun || !card) return;
      const bounds = page.getBoundingClientRect();
      const origin = sun.getBoundingClientRect();
      const target = card.getBoundingClientRect();
      const x = origin.left + origin.width / 2 - bounds.left;
      const y = origin.top + origin.height / 2 - bounds.top;
      const left = target.left - bounds.left;
      const right = target.right - bounds.left;
      const top = target.top - bounds.top;
      setBeam([x - 12, y, x + 12, y + 12, right, top + 40, left, top + 40].join(" "));
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    observer.observe(card);
    observer.observe(sun);
    return () => observer.disconnect();
  }, [mode]);

  function select(next: InterviewMode) {
    setMode(next);
    setSunshine(value => value + 1);
    setStartError(null);
  }

  function startInterview(next: InterviewMode) {
    if (startingRef.current) return;
    select(next);
    startingRef.current = true;
    setStarting(next);
    try {
      // Temporary direct route uses the room's existing bundled sample.
      navigate("/interview/" + encodeURIComponent(fakeProblem.slug) + "?mode=" + next);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "We couldn't start your interview. Please try again.");
    } finally {
      startingRef.current = false;
      setStarting(null);
    }
  }

  return <main ref={pageRef} className={["interview-selection-page app-sidebar-layout flex min-h-svh flex-col bg-[#f7f4e9] px-4 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#3054ed]", interviewStyles].join(" ")}>
    <NavbarDashboard /><div className="interview-pond" aria-hidden="true"><WaterWaves className="interview-pond-waves" /><PondLife /></div>
    {sunshine > 0 && beam && <svg className="interview-sunbeam" aria-hidden="true" focusable="false"><polygon key={sunshine} points={beam} /></svg>}
    <div ref={sunRef} className="interview-sun" aria-hidden="true">
      <div key={sunshine} className="interview-sun-art" data-shining={sunshine > 0}>
        <svg viewBox="0 0 200 200" fill="none" focusable="false">
          <g className="interview-sun-rays" stroke="#e3b82d" strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 12 }, (_, index) => <path key={index} d="M100 24V36" transform={"rotate(" + index * 30 + " 100 100)"} />)}
          </g>
          <circle className="interview-sun-halo" cx="100" cy="100" r="57" fill="#ffdf4f" fillOpacity=".22" />
          <circle cx="100" cy="100" r="43" fill="#ffdf4f" />
          <path d="M76 88C79 77 87 70 98 68" stroke="#FFE9AD" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
    <section className="interview-path-shell mx-auto w-full max-w-[1120px] flex-1 py-10 lg:py-14" aria-labelledby="mode-heading">
      <header className="interview-path-heading mb-10"><h1 id="mode-heading" className="cloud-heading text-4xl font-semibold tracking-[-0.045em] sm:text-5xl"><TextType as="span" text="Choose your path" typingSpeed={65} initialDelay={150} loop={false} showCursor cursorBlinkDuration={0.6} /></h1><p className="mt-4 text-base leading-7 text-[#687087]">Practice with guidance or try a realistic mock interview.</p></header>
      <div className="interview-path-options" role="group" aria-label="Interview paths">
        <article onPointerEnter={() => setSunshine(value => value + 1)} onFocus={() => setSunshine(value => value + 1)} ref={practiceRef} className="interview-path-card" data-selected={mode === "practice"} aria-labelledby="practice-heading" onClick={() => select("practice")}>
          <button type="button" className="interview-path-selector" aria-pressed={mode === "practice"} onClick={event => { event.stopPropagation(); select("practice"); }}><span className="interview-path-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8" /></svg></span><span className="interview-path-check" aria-hidden="true">{mode === "practice" ? "✓" : ""}</span><h2 id="practice-heading"><DecryptedText text="Practice Interview" animateOn="inViewHover" speed={35} sequential revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" encryptedClassName="interview-encrypted-letter" /></h2></button>
          <p className="interview-path-description">Practice with your AI coach in a flexible, more forgiving setting.</p>
          <ul className="interview-path-benefits"><li>Guidance when you need it</li><li>Work at your own pace</li></ul>
          <div className="interview-practice-problem"><p className="text-[10px] font-semibold uppercase tracking-widest text-[#2946c5]">{selectedProblem ? "Your chosen problem" : "Next recommended problem"}</p>{practiceProblem ? <><h3 className="mt-3 text-lg font-semibold">{practiceProblem.title}</h3><span className="mt-2 inline-block rounded-full bg-white/60 px-3 py-1 text-xs text-[#2946c5]">{practiceProblem.difficulty}</span></> : loading ? <p role="status" className="mt-3 text-sm text-[#456075]">Finding your next problem...</p> : recommendationError ? <div className="mt-3 text-sm text-[#456075]"><p role="alert">Couldn't load your recommendation.</p><button type="button" className="mt-2 font-semibold underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : <p className="mt-3 text-sm text-[#456075]">Pick a problem to get started.</p>}<Link to="/problems?choose=practice" className="mt-4 inline-flex min-h-10 items-center gap-3 text-sm font-semibold text-[#3054ed]">Choose from the problem library <span aria-hidden="true">&#8599;</span></Link></div>
          <button type="button" disabled={starting !== null} onClick={() => void startInterview("practice")} className="interview-path-start">{starting === "practice" ? "Starting..." : "Start interview"}<span aria-hidden="true">&#8594;</span></button>
        </article>
        <article onPointerEnter={() => setSunshine(value => value + 1)} onFocus={() => setSunshine(value => value + 1)} ref={mockRef} className="interview-path-card" data-selected={mode === "mock"} aria-labelledby="mock-heading" onClick={() => select("mock")}>
          <button type="button" className="interview-path-selector" aria-pressed={mode === "mock"} onClick={event => { event.stopPropagation(); select("mock"); }}><span className="interview-path-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M12 11v4" /></svg></span><span className="interview-path-check" aria-hidden="true">{mode === "mock" ? "✓" : ""}</span><h2 id="mock-heading"><DecryptedText text="Mock Interview" animateOn="inViewHover" speed={35} delay={150} sequential revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" encryptedClassName="interview-encrypted-letter" /></h2></button>
          <p className="interview-path-description">Step into a real interview setting and show what you can do.</p>
          <ul className="interview-path-benefits"><li>Approximately 30 minutes</li><li>No hints or coaching</li><li>A surprise problem</li></ul>
          <button type="button" disabled={starting !== null} onClick={() => void startInterview("mock")} className="interview-path-start">{starting === "mock" ? "Starting..." : "Start interview"}<span aria-hidden="true">&#8594;</span></button>
        </article>
      </div>
      {startError && <p role="alert" className="mt-6 rounded-2xl border border-[#bcd5f4] bg-white/70 p-4 text-sm text-[#456075]">{startError}</p>}
    </section>
    <WaterWaves className="interview-footer-waves" />
  </main>;
}
