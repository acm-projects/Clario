import { defineEditorThemes } from "../../lib/editorThemes";
import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel } from "./Panel";
import type { Language, Problem } from "../../types";

interface CodePanelProps {
  starterCode: Problem["starter_code"];
  theme: "dark" | "light";
  initialLanguage?: Language;
  lockLanguage?: boolean;
  onChange?: (language: Language, code: string) => void;
}

const LANGUAGES: { id: Language; label: string; monaco: string }[] = [
  { id: "python3", label: "Python 3", monaco: "python" },
  { id: "java", label: "Java", monaco: "java" },
];


export function CodePanel({ starterCode, theme, initialLanguage = "python3", lockLanguage = false, onChange }: CodePanelProps) {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [codes, setCodes] = useState<Record<Language, string>>({ ...starterCode });
  const [pos, setPos] = useState({ line: 7, col: 17 });
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleMount: OnMount = (editor) => {
    editor.setPosition({ lineNumber: 7, column: 17 });
    editor.onDidChangeCursorPosition((e) =>
      setPos({ line: e.position.lineNumber, col: e.position.column }),
    );
  };

  const handleChange = (value?: string) => {
    const code = value ?? "";
    setCodes((prev) => ({ ...prev, [lang]: code }));
    onChange?.(lang, code);
    setSaved(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaved(true), 600);
  };

  const current = LANGUAGES.find((l) => l.id === lang)!;

  return (
    <Panel className={"sandbox-code [&.sandbox-code_>_div:first-child]:[background:var(--page-bg)] [&.sandbox-code_>_div:first-child]:[border-bottom:1px_solid_var(--line)] [&.sandbox-code_>_div:last-child]:[background:#0f1a2e] [&.sandbox-code_>_div:last-child]:[color:#a9bce0] [&.sandbox-code_>_div:last-child]:[border-top:1px_solid_#202b42] [&.sandbox-code_>_div:last-child_.theme-muted-text]:[color:#a9bce0] [&.sandbox-code_>_div:last-child_.theme-muted-text]:[font-family:monospace] [@media_(max-width:_600px)]:[&.sandbox-code]:[min-height:480px]"}>
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex gap-2" role="group" aria-label="Language">
          {LANGUAGES.map((item) => <button key={item.id} disabled={lockLanguage && lang !== item.id} aria-pressed={lang === item.id}
            className={`sandbox-button [&.sandbox-button]:[padding:8px_15px] [&.sandbox-button]:[border:1px_solid_var(--line)] [&.sandbox-button]:[border-radius:9px] [&.sandbox-button]:[background:var(--panel-bg)] [&.sandbox-button]:[font-size:13px] [&.sandbox-button]:[cursor:pointer] [&.sandbox-button:hover]:[background:var(--surface-hover)] [&.sandbox-button.is-active]:[background:#2378db] [&.sandbox-button.is-active]:[color:#fff] [@media_(max-width:_1150px)]:[&.sandbox-button]:[padding:8px_10px] ${lang === item.id ? "is-active" : ""}`}
            onClick={() => { setLang(item.id); onChange?.(item.id, codes[item.id]); }}>{item.label}</button>)}
        </div>
        <button className={"sandbox-button [&.sandbox-button]:[padding:8px_15px] [&.sandbox-button]:[border:1px_solid_var(--line)] [&.sandbox-button]:[border-radius:9px] [&.sandbox-button]:[background:var(--panel-bg)] [&.sandbox-button]:[font-size:13px] [&.sandbox-button]:[cursor:pointer] [&.sandbox-button:hover]:[background:var(--surface-hover)] [&.sandbox-button.is-active]:[background:#2378db] [&.sandbox-button.is-active]:[color:#fff] [@media_(max-width:_1150px)]:[&.sandbox-button]:[padding:8px_10px]"} onClick={() => handleChange(starterCode[lang])}>Reset</button>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          path={`solution.${lang}`}
          language={current.monaco}
          value={codes[lang]}
          theme={`clario-${theme}`}
          beforeMount={defineEditorThemes}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 15,
            lineHeight: 31,
            fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
            padding: { top: 22 },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: false,
            renderLineHighlight: "none",
            scrollBeyondLastLine: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
          }}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-xs">
        <span>{saved ? "Saved" : "Saving…"}</span>
        <span className="theme-muted-text">
          Ln {pos.line}, Col {pos.col}
        </span>
      </div>
    </Panel>
  );
}
