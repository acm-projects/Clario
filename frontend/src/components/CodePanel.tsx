import { useEffect, useRef, useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Panel, Pill } from "./Panel";
import type { Language, Problem } from "../types";

interface CodePanelProps {
  starterCode: Problem["starter_code"];
  theme: "dark" | "light";
  initialLanguage?: Language;
  onChange?: (language: Language, code: string) => void;
}

const LANGUAGES: { id: Language; label: string; monaco: string }[] = [
  { id: "java", label: "Java", monaco: "java" },
  { id: "python3", label: "Python 3", monaco: "python" },
];

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("clario-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "f472b6" },
      { token: "type.identifier", foreground: "fb923c" },
      { token: "number", foreground: "f472b6" },
      { token: "identifier", foreground: "dfe6f3" },
      { token: "delimiter", foreground: "c3cde0" },
    ],
    colors: {
      "editor.background": "#0f1a2e",
      "editor.lineHighlightBackground": "#3a3418",
      "editor.lineHighlightBorder": "#0f1a2e00",
      "editorLineNumber.foreground": "#4a5873",
      "editorLineNumber.activeForeground": "#8a97ad",
      "editorCursor.foreground": "#dfe6f3",
    },
  });
  monaco.editor.defineTheme("clario-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c0266d" },
      { token: "type.identifier", foreground: "b45309" },
      { token: "number", foreground: "c0266d" },
      { token: "identifier", foreground: "172333" },
      { token: "delimiter", foreground: "34445a" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.lineHighlightBackground": "#edf2f7",
      "editor.lineHighlightBorder": "#ffffff00",
      "editorLineNumber.foreground": "#9aa8b8",
      "editorLineNumber.activeForeground": "#65758b",
      "editorCursor.foreground": "#172333",
    },
  });
};

export function CodePanel({ starterCode, theme, initialLanguage = "java", onChange }: CodePanelProps) {
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
    <Panel>
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="theme-main-text text-sm font-semibold">Code</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          aria-label="Language"
          className="theme-surface theme-body-text cursor-pointer appearance-none rounded-full px-3 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fd0]"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          path={`solution.${lang}`}
          language={current.monaco}
          value={codes[lang]}
          theme={`clario-${theme}`}
          beforeMount={defineTheme}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 21,
            fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: false,
            renderLineHighlight: "all",
            scrollBeyondLastLine: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
          }}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-xs">
        <Pill>{saved ? "Saved" : "Saving…"}</Pill>
        <span className="theme-muted-text">
          Ln {pos.line}, Col {pos.col}
        </span>
      </div>
    </Panel>
  );
}
