import { TopBar } from "../components/interview/TopBar";
import { VideoCallPanel } from "../components/interview/VideoCallPanel";
import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getRepoChallenge, listRepoChallenges, runRepoChallenge, type RepoChallenge, type RepoChallengeSummary, type RepoEvaluation } from "../api/repoChallenges";
import RepositoryExplorer, { RepositoryFileIcon } from "../components/interview/RepositoryExplorer";
import ProblemLoading from "../components/ui/ProblemLoading";
import DuckHead from "../components/layout/DuckHead";
import { useAppearance, setAppearance } from "../lib/appearance";
import { defineEditorThemes } from "../lib/editorThemes";
import type { ProfileContext } from "../lib/profile";

export default function RepoDebugging() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user } = useOutletContext<ProfileContext>();
  const theme = useAppearance();
  return <main className={`repo-workspace [--repo-accent:#3054ed] [&_[data-sandbox-run]]:bg-[#3054ed]! [&_[data-sandbox-run]]:text-white! [&_[data-sandbox-run]:hover]:bg-[#2543ca]! [&_.sandbox-theme-toggle_button[aria-pressed=true]]:bg-[#3054ed]! [&_.sandbox-theme-toggle_button[aria-pressed=true]]:text-white! min-h-svh font-sans [&_.theme-panel]:bg-[var(--panel-bg)] [&_.theme-panel]:border-[var(--line)] [&_.theme-border]:border-[var(--line)] [&_.theme-main-text]:text-[var(--text-main)] [&_.theme-body-text]:text-[var(--text-body)] [&_.theme-muted-text]:text-[var(--text-muted)] [&_.theme-surface]:bg-[var(--surface)] [&_.theme-video-self]:bg-[var(--video-self)] [&_.theme-video-self]:border-[var(--line)] [&_.theme-video-interviewer]:bg-[var(--video-interviewer)] [&_.theme-video-interviewer]:border-[var(--repo-line)]! [&_.theme-video-interviewer]:border! [&_.theme-avatar-ring]:ring-[#2378db] ${theme === "dark" ? "bg-[#0a1120] text-[#edf1fb] [--repo-panel:#0f1a2e] [--repo-accent:#96aaff] [--repo-line:#495362] [--repo-muted:#a3b2cc] [--line:#495362] [--panel-bg:#0f1a2e] [--text-main:#f4f7fc] [--text-body:#c3cde0] [--text-muted:#8a97ad] [--surface:#1a2842] [--video-self:#0c1626] [--video-interviewer:#3054ed] [--avatar-ring:#2378db]" : "bg-[#fbf4df] text-[#182137] [--repo-panel:#fffcf4] [--repo-line:#c5c8ce] [--repo-muted:#687087] [--line:#c5c8ce] [--panel-bg:#fff] [--text-main:#173153] [--text-body:#254268] [--text-muted:#587096] [--surface:#fbf4df] [--video-self:#fbf4df] [--video-interviewer:#3054ed] [--avatar-ring:#2378db]"} [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_:is(button,a):focus-visible]:outline-2 [&_:is(button,a):focus-visible]:outline-offset-[-2px] [&_:is(button,a):focus-visible]:outline-[#3054ed]`}>
    {challengeId ? <RepoWorkspace key={`${user.id}:${challengeId}`} id={challengeId} userId={user.id} /> : <ChallengePicker />}
  </main>;
}

function ChallengePicker() {
  const [challenges, setChallenges] = useState<RepoChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const theme = useAppearance();
  useEffect(() => {
    const controller = new AbortController();
    listRepoChallenges(controller.signal).then(data => { if (!controller.signal.aborted) { setChallenges(data); setLoading(false); setError(null); } }).catch(error => { if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : "Could not load challenges."); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);
  return <div className="mx-auto max-w-[1080px] px-6 py-8 sm:py-14">
    <Link to="/interview" className="inline-flex min-h-11 items-center text-sm text-[var(--repo-muted)]">← All interview modes</Link>
    <div className="mb-10 mt-8 flex items-center gap-5"><span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#3054ed]"><DuckHead className="size-12" /></span><div><p className="text-[10px] font-semibold tracking-[.18em] text-[var(--repo-accent)]">READ. REASON. REPAIR.</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Repo Debugging</h1></div></div>
    <p className="mb-8 max-w-[620px] text-sm leading-7 text-[var(--repo-muted)]">Debug a real-world codebase, fix bugs, and test your solution in a repository-based coding interview. Small repositories. Real behavior. No setup needed.</p>
    {loading ? <ProblemLoading dark={theme === "dark"} /> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1); }} className="mt-4 rounded-xl bg-[#3054ed] px-5 py-3 text-sm text-white">Try again</button></div> : <div className="grid gap-5 sm:grid-cols-2">{challenges.map((challenge, index) => <Link key={challenge.id} to={`/repo-debugging/${encodeURIComponent(challenge.id)}`} className="group flex flex-col rounded-[24px] border border-[var(--repo-line)] bg-[var(--repo-panel)] p-7 transition-colors hover:border-[#3054ed]">
      <div className="flex justify-between font-mono text-xs text-[var(--repo-muted)]"><span>REPOSITORY / 0{index + 1}</span><span>{challenge.difficulty}</span></div><h2 className="mt-7 text-xl font-semibold tracking-tight">{challenge.title}</h2><p className="mb-7 mt-3 text-sm leading-7 text-[var(--repo-muted)]">{challenge.description}</p><div className="mt-auto flex items-center justify-between border-t border-[var(--repo-line)] pt-5 text-xs"><span>Python · ~{challenge.estimatedMinutes} minutes</span><span className="font-semibold text-[var(--repo-accent)]">Open repository ↗</span></div>
    </Link>)}</div>}
  </div>;
}

function RepoWorkspace({ id, userId }: { id: string; userId: string }) {
  const theme = useAppearance();
  const navigate = useNavigate();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [callOpen, setCallOpen] = useState(true);
  const [resultsHeight, setResultsHeight] = useState(225);
  const [resultTab, setResultTab] = useState<"tests" | "errors">("tests");
  useEffect(() => { if (!started) return; const origin = Date.now(); const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - origin) / 1000)), 1000); return () => window.clearInterval(timer); }, [started]);
  const [challenge, setChallenge] = useState<RepoChallenge | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const busyRef = useRef(false);
  const [result, setResult] = useState<RepoEvaluation | null>(null);
  const [evaluatedSource, setEvaluatedSource] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(() => { try { return localStorage.getItem(`clario:repo-brief:${id}`) !== "seen"; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem(`clario:repo-brief:${id}`, "seen"); } catch { /* Optional preference. */ } }, [id]);
  const [draftStatus, setDraftStatus] = useState("Local draft ready");
  const submitDialog = useRef<HTMLDialogElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const editorListener = useRef<{ dispose: () => void } | null>(null);
  useEffect(() => () => editorListener.current?.dispose(), []);
  const latestDraft = useRef<{ starter: string; files: Record<string, string> } | null>(null);
  const draftKey = `clario:repo-draft:v1:${userId}:${id}`;

  useEffect(() => {
    const controller = new AbortController();
    getRepoChallenge(id, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      const initial = Object.fromEntries(data.files.map(file => [file.path, file.content]));
      let restored = false;
      try {
        const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
        if (saved?.starter === JSON.stringify(data.files)) {
          for (const file of data.files) if (!file.readOnly && typeof saved.files?.[file.path] === "string" && saved.files[file.path].length <= 50_000) { initial[file.path] = saved.files[file.path]; restored = true; }
        }
      } catch { /* A malformed local draft cannot replace trusted starter data. */ }
      setChallenge(data); setContents(initial); setActive(data.entrypoint); setTabs([data.entrypoint]); setLoadError(null);
      setDraftStatus(restored ? "Restored your browser draft" : "Local draft ready");
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load repository."); });
    return () => controller.abort();
  }, [id, draftKey, retry]);

  useEffect(() => {
    if (!challenge) return;
    latestDraft.current = { starter: JSON.stringify(challenge.files), files: contents };
    const persist = () => localStorage.setItem(draftKey, JSON.stringify({ starter: JSON.stringify(challenge.files), files: contents }));
    const timer = window.setTimeout(() => {
      try { persist(); }
      catch { setDraftStatus("Browser storage unavailable. Download your files to keep a copy."); }
    }, 500);
    return () => {
      window.clearTimeout(timer);

    };
  }, [contents, challenge, draftKey]);

  useEffect(() => {
    const flush = () => { try { if (latestDraft.current) localStorage.setItem(draftKey, JSON.stringify(latestDraft.current)); } catch { /* Best effort on exit. */ } };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [draftKey]);

  const modified = challenge?.files.filter(file => !file.readOnly && contents[file.path] !== file.content).length ?? 0;
  const source = JSON.stringify(challenge?.files.filter(file => !file.readOnly).map(file => [file.path, contents[file.path]]));
  const stale = evaluatedSource !== null && evaluatedSource !== source;
  const selected = challenge?.files.find(file => file.path === active);

  const mountEditor: OnMount = (editor, monaco) => {
    editorListener.current?.dispose();
    editorListener.current = editor.onDidChangeModelContent(event => {
      if (event.isFlush) return;
      if (busyRef.current || !challenge) return;
      const model = editor.getModel();
      if (!model) return;
      const file = challenge.files.find(item => model.uri.toString() === monaco.Uri.parse(`clario-repo://${userId}/${id}/${item.path}`).toString());
      if (!file || file.readOnly) return;
      if (editor.getOption(monaco.editor.EditorOption.readOnly)) return;
      const content = model.getValue();
      setContents(previous => previous[file.path] === content ? previous : { ...previous, [file.path]: content });
    });
  };

  function open(path: string) { setActive(path); setTabs(previous => previous.includes(path) ? previous : [...previous, path]); }
  function closeTab(path: string) { const remaining = tabs.filter(item => item !== path); setTabs(remaining); if (active === path) setActive(remaining.at(-1) ?? null); }
  async function execute(submit: boolean) {
    if (!challenge || busyRef.current) return;
    busyRef.current = true; setBusy(submit ? "submit" : "run"); setExecutionError(null); setResult(null); setResultsOpen(true); setResultsHeight(height => Math.max(225, height)); setResultTab("tests");
    const snapshot = source;
    const files = Object.fromEntries(challenge.files.filter(file => !file.readOnly).map(file => [file.path, contents[file.path]]));
    try { const evaluation = await runRepoChallenge(id, files, submit); setResult(evaluation); setEvaluatedSource(snapshot); }
    catch (error) { setExecutionError(error instanceof Error ? error.message : "Execution failed. Please try again."); }
    finally { busyRef.current = false; setBusy(null); }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ challenge_id: id, files: contents, evaluation: stale ? null : result }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${id}-workspace.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function reset() {
    if (!challenge || busyRef.current) return;
    setContents(Object.fromEntries(challenge.files.map(file => [file.path, file.content]))); setResult(null); setExecutionError(null); setEvaluatedSource(null); resetDialog.current?.close();
  }

  if (loadError) return <div className="grid min-h-svh place-items-center p-8"><div role="alert"><h1 className="text-xl font-semibold">Could not open repository</h1><p className="mt-4 text-sm">{loadError}</p><div className="mt-6 flex gap-5"><button type="button" onClick={() => { setLoadError(null); setRetry(value => value + 1); }}>Try again</button><Link to="/repo-debugging">All challenges</Link></div></div></div>;
  if (!challenge) return <ProblemLoading fullScreen dark={theme === "dark"} />;

  return <div className="flex min-h-svh flex-col lg:h-svh lg:overflow-hidden">
    <div className="[&_header]:h-auto [&_header]:min-h-[74px] [&_header]:flex-wrap [&_header]:gap-3 [&_header]:py-3 max-xl:[&_header>div:nth-child(2)]:static max-xl:[&_header>div:nth-child(2)]:translate-x-0 max-sm:[&_header>div:first-child]:flex-wrap max-sm:[&_header>div:first-child]:gap-3 max-sm:[&_header>div:last-child]:hidden">
      <TopBar showBrand={false} timer={`${String(Math.floor(Math.max(0, challenge.estimatedMinutes * 60 - elapsed) / 60)).padStart(2, "0")}:${String(Math.max(0, challenge.estimatedMinutes * 60 - elapsed) % 60).padStart(2, "0")}`} modeLabel="Repo Debugging" theme={theme} onThemeChange={setAppearance} onRun={() => void execute(false)} onSubmit={() => submitDialog.current?.showModal()} running={Boolean(busy)} listLabel="Repositories" listPath="/repo-debugging" runLabel="Run Tests" />
    </div>
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--repo-line)] px-4 py-2 text-xs"><button type="button" aria-expanded={explorerOpen} aria-controls="repo-file-explorer" onClick={() => setExplorerOpen(value => !value)} className="flex min-h-9 items-center gap-2 rounded-lg border border-[var(--repo-line)] bg-[var(--repo-panel)] px-3 text-[var(--repo-muted)]"><span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg></span>{explorerOpen ? "Hide files" : "Show files"}</button><button type="button" onClick={() => setCallOpen(value => !value)} aria-expanded={callOpen} className="shrink-0 px-2 py-2">{callOpen ? "Hide call" : "Show call"}</button><h1 className="min-w-0 flex-1 truncate font-semibold">{challenge.title}</h1><span className="rounded-full border border-[var(--repo-line)] px-3 py-1 text-[10px] text-[var(--repo-muted)]">{challenge.difficulty} &middot; Python</span></div>
    <div className={`grid min-h-0 flex-1 grid-cols-1 gap-4 p-3 ${callOpen ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-1"} lg:p-4`}>
    <div className={`grid min-h-0 min-w-0 overflow-hidden rounded-[18px] border border-[var(--repo-line)] ${explorerOpen ? "lg:grid-cols-[210px_minmax(0,1fr)]" : "grid-cols-1"}`}>
      {explorerOpen && <aside id="repo-file-explorer" className="max-h-[240px] overflow-y-auto border-b border-[var(--repo-line)] bg-[var(--repo-panel)] lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-3 py-4"><h2 className="text-[10px] font-semibold tracking-widest text-[var(--repo-muted)]">EXPLORER</h2><span className="text-[10px] text-[var(--repo-muted)]">{challenge.files.length} files</span></div>
        <RepositoryExplorer rootName={id} files={challenge.files} contents={contents} active={active} onOpen={open} />
        <div className="flex flex-wrap gap-3 border-t border-[var(--repo-line)] p-3 text-[10px] text-[var(--repo-muted)]"><button type="button" disabled={Boolean(busy)} onClick={() => resetDialog.current?.showModal()}>Reset files</button><button type="button" onClick={download}>Download draft</button></div>
      </aside>}
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className={`grid min-h-0 flex-1 grid-cols-1 ${instructionsOpen ? "lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
          <section aria-label="Repository editor" className="flex min-h-[480px] min-w-0 flex-col bg-[var(--repo-panel)] lg:min-h-0">
            <div className="flex min-h-10 shrink-0 items-center border-b border-[var(--repo-line)]"><div className="flex min-w-0 flex-1 overflow-x-auto" aria-label="Open files">{tabs.map(path => <div key={path} className={`flex shrink-0 items-center border-r border-[var(--repo-line)] ${path === active ? "border-t-2 border-t-[#3054ed] bg-[#3054ed]/10" : ""}`}><button type="button" aria-pressed={path === active} onClick={() => setActive(path)} className="flex min-h-10 items-center gap-2 px-3 text-xs"><RepositoryFileIcon path={path} />{path}{challenge.files.some(file => file.path === path && !file.readOnly && file.content !== contents[path]) && <span aria-label="Modified" className="ml-2 text-[#c99824]">●</span>}</button><button type="button" aria-label={`Close ${path}`} onClick={() => closeTab(path)} className="min-h-10 px-2 text-sm text-[var(--repo-muted)]">×</button></div>)}</div><button type="button" aria-expanded={instructionsOpen} aria-controls="repo-instructions" onClick={() => setInstructionsOpen(value => !value)} className="min-h-10 shrink-0 px-3 text-[10px] text-[var(--repo-accent)]">{instructionsOpen ? "Close brief" : "Open brief"}</button></div>
            {selected ? <Editor path={`clario-repo://${userId}/${id}/${selected.path}`} saveViewState language={selected.path.endsWith(".py") ? "python" : "markdown"} value={contents[selected.path]} beforeMount={defineEditorThemes} theme={`clario-${theme}`} onMount={mountEditor} loading={<p className="p-6 text-xs text-[var(--repo-muted)]">Opening editor…</p>} options={{ readOnly: selected.readOnly || Boolean(busy), automaticLayout: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, padding: { top: 18 }, tabSize: 4 }} /> : <div className="grid flex-1 place-items-center p-8 text-sm text-[var(--repo-muted)]">Open a file from the explorer. Your edits are still here.</div>}
            <div className="flex shrink-0 flex-wrap justify-between gap-2 border-t border-[var(--repo-line)] px-3 py-2 text-[10px] text-[var(--repo-muted)]"><span>{selected?.path ?? "No file selected"}{selected?.readOnly ? " · Read only" : ""}</span><span>{modified} modified · {draftStatus}</span></div>
          </section>
          {instructionsOpen && <aside aria-label="Challenge brief" id="repo-instructions" className="order-first overflow-y-auto border-t border-[var(--repo-line)] bg-[var(--repo-panel)] p-5 border-b"><div className="flex items-center justify-between gap-2 border-b border-[var(--repo-line)] pb-3"><p className="text-[10px] font-semibold tracking-widest text-[var(--repo-accent)]">INCIDENT BRIEF</p><button type="button" onClick={() => setInstructionsOpen(false)} aria-label="Close brief" className="flex min-h-9 items-center gap-1 rounded-lg border border-[var(--repo-line)] px-2 text-[10px] text-[var(--repo-muted)] hover:bg-[#3054ed]/10">Close <span aria-hidden="true">&#215;</span></button></div><h2 className="mt-4 text-lg font-semibold tracking-tight">Find the cause. Prove the fix.</h2><p className="mt-3 text-xs leading-6 text-[var(--repo-muted)]">{challenge.description}</p><h3 className="mt-6 text-xs font-semibold">Your objective</h3><p className="mt-2 text-xs leading-6 text-[var(--repo-muted)]">{challenge.objective}</p><h3 className="mt-6 text-xs font-semibold">Expected behavior</h3><p className="mt-2 text-xs leading-6 text-[var(--repo-muted)]">{challenge.expectedBehavior}</p><h3 className="mt-6 text-xs font-semibold">Working agreements</h3><ul className="mt-2 list-disc space-y-2 pl-4 text-xs leading-6 text-[var(--repo-muted)]">{challenge.constraints.map(item => <li key={item}>{item}</li>)}</ul><p className="mt-6 border-t border-[var(--repo-line)] pt-4 text-[10px] leading-5 text-[var(--repo-muted)]">Python · ~{challenge.estimatedMinutes} minutes<br />No terminal or external packages. Run Tests runs visible tests. Submit adds private edge-case tests.</p></aside>}
        </div>
        <section style={resultsOpen ? { height: resultsHeight, maxHeight: "55vh" } : undefined} aria-label="Test results" aria-busy={Boolean(busy)} className="shrink-0 border-t border-[var(--repo-line)] bg-[var(--repo-panel)]">
          <div role="separator" aria-label="Resize test results" aria-orientation="horizontal" tabIndex={0} className="h-2 touch-none cursor-row-resize bg-[var(--repo-line)]" onKeyDown={event => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); setResultsHeight(h => Math.max(100, Math.min(window.innerHeight * .55, h + (event.key === "ArrowUp" ? 20 : -20)))); } }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setResultsHeight(h => Math.max(100, Math.min(window.innerHeight * .55, h - event.movementY))); }} />
          <button type="button" aria-expanded={resultsOpen} aria-controls="repo-results" onClick={() => setResultsOpen(value => !value)} className="flex min-h-11 w-full items-center justify-between px-4 text-[10px] font-semibold tracking-widest"><span>TEST RESULTS {result ? `· ${result.passed}/${result.total} PASSED` : ""}{stale ? " · FILES CHANGED — RUN AGAIN" : ""}</span><span>{resultsOpen ? "−" : "+"}</span></button>
          {resultsOpen && <div id="repo-results" className="h-[calc(100%-52px)] overflow-y-auto px-4 pb-4">
            <div className="mb-3 flex gap-4 text-xs"><button onClick={() => setResultTab("tests")} aria-pressed={resultTab === "tests"}>Tests</button><button onClick={() => setResultTab("errors")} aria-pressed={resultTab === "errors"}>Errors</button></div>{resultTab === "errors" ? <pre className="whitespace-pre-wrap text-xs">{executionError || result?.stderr || result?.error || "No execution errors."}</pre> : busy ? <p role="status" className="flex items-center gap-3 py-4 text-xs text-[var(--repo-muted)]"><span aria-hidden="true" className="size-4 rounded-full border-2 border-[#3054ed]/30 border-t-[#3054ed] motion-safe:animate-spin" />{busy === "submit" ? "Running final evaluation in Piston…" : "Running repository tests in Piston…"}</p> : executionError ? <p role="alert" className="py-3 text-xs text-[#dd697c]">{executionError}</p> : result ? <div aria-live="polite"><p className={`mb-3 text-xs ${result.success ? "text-[#4baf83]" : "text-[#d6963b]"}`}>{stale ? "These results are from an earlier version of your files." : result.success ? "All behavior checks passed." : `${result.failed} checks did not pass.`}</p>{result.error && <p role="alert" className="mb-3 text-xs text-[#dd697c]">{result.error}</p>}<ul className="grid gap-2 sm:grid-cols-2">{result.tests.map(test => <li key={test.name} className="text-xs"><span className={test.passed ? "text-[#4baf83]" : "text-[#dd697c]"}>{test.passed ? "✓" : "×"}</span> {test.name.replace(/^test_/, "").replaceAll("_", " ")}{test.message && <details className="mt-1 pl-4 text-[10px] text-[var(--repo-muted)]"><summary>Failure details</summary><pre className="whitespace-pre-wrap">{test.message}</pre></details>}</li>)}</ul>{result.submission && <p role="status" className="mt-4 rounded-lg border border-[var(--repo-line)] p-3 text-xs leading-6">{result.submission.message}{result.submission.saved && <span className="block text-[10px] text-[var(--repo-muted)]">Submission {result.submission.submission_id}</span>}</p>}</div> : <p className="py-4 text-xs leading-6 text-[var(--repo-muted)]">Run the tests to see results.</p>}
          </div>}
        </section>
      </div>
    </div>
    <aside hidden={!callOpen} aria-label="Interview call" className={`${callOpen ? "flex" : "hidden"} theme-panel min-h-[500px] min-w-0 flex-col rounded-[18px] border p-3 lg:min-h-0`}><VideoCallPanel round="Repository debugging" interviewer="Clario" problemSlug={id} repoChallengeId={id} speaking={false} onInterviewStart={() => setStarted(true)} onEndInterview={() => navigate("/repo-debugging")} /></aside>
    </div>
    <dialog ref={submitDialog} aria-labelledby="repo-submit-title" className="fixed inset-0 m-auto max-w-[420px] rounded-2xl border border-[var(--repo-line)] bg-[var(--repo-panel)] p-6 text-inherit backdrop:bg-black/60"><h2 id="repo-submit-title" className="text-xl font-semibold">Submit this repository?</h2><p className="mt-3 text-sm">{result && !stale ? `${result.failed} tests are still failing.` : "Your current files have not been verified."} Submit runs visible and hidden checks.</p><div className="mt-6 flex justify-end gap-4"><button onClick={() => submitDialog.current?.close()}>Cancel</button><button disabled={Boolean(busy)} onClick={() => { submitDialog.current?.close(); void execute(true); }}>Submit</button></div></dialog>
    <dialog ref={resetDialog} className={`fixed inset-0 m-auto w-[calc(100%-32px)] max-w-[420px] rounded-2xl border border-[var(--repo-line)] bg-[var(--repo-panel)] p-6 text-inherit shadow-2xl backdrop:bg-[#0a1120]/65 ${theme === "dark" ? "[color-scheme:dark]" : ""}`} aria-labelledby="repo-reset-title"><h2 id="repo-reset-title" className="text-xl font-semibold">Reset this repository?</h2><p className="mt-3 text-sm leading-7 text-[var(--repo-muted)]">This replaces all edits with the original starter files. Download a draft first if you want to keep your changes.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => resetDialog.current?.close()} className="min-h-11 px-4 text-sm">Keep editing</button><button type="button" disabled={Boolean(busy)} onClick={reset} className="min-h-11 rounded-xl bg-[#3054ed] px-4 text-sm text-white">Reset files</button></div></dialog>
  </div>;
}
