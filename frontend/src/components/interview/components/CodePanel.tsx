import { useEffect, useRef, useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Panel } from "./Panel";
import type { Language, Problem } from "../../../types";

interface CodePanelProps {
  starterCode: Problem["starter_code"];
  theme: "dark" | "light";
  initialLanguage?: Language;
  onChange?: (language: Language, code: string) => void;
}

const LANGUAGES: { id: Language; label: string; monaco: string }[] = [
  { id: "python3", label: "Python 3", monaco: "python" },
  { id: "java", label: "Java", monaco: "java" },
];

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("clario-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "91A6C9", fontStyle: "italic" },
      { token: "keyword", foreground: "FAC52E" },
      { token: "keyword.operator", foreground: "9ABEFF" },
      { token: "type.identifier", foreground: "9ABEFF" },
      { token: "type", foreground: "9ABEFF" },
      { token: "string", foreground: "B9D9AC" },
      { token: "string.escape", foreground: "FFCF8A" },
      { token: "number", foreground: "FFCF8A" },
      { token: "identifier", foreground: "E2EBFA" },
      { token: "delimiter", foreground: "B8C9E5" },
      { token: "operator", foreground: "9ABEFF" },
    ],
    colors: {
      "editor.background": "#0f1a2e",
      "editor.foreground": "#E2EBFA",
      "editor.lineHighlightBackground": "#192840",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#8297BA",
      "editorLineNumber.activeForeground": "#FAC52E",
      "editorCursor.foreground": "#FAC52E",
      "editor.selectionBackground": "#305ED166",
      "editor.inactiveSelectionBackground": "#305ED133",
      "editor.selectionHighlightBackground": "#9ABEFF22",
      "editorIndentGuide.background1": "#253550",
      "editorIndentGuide.activeBackground1": "#647DA6",
      "editorBracketMatch.background": "#FAC52E22",
      "editorBracketMatch.border": "#FAC52E",
    },
  });
  monaco.editor.defineTheme("clario-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "65748C", fontStyle: "italic" },
      { token: "keyword", foreground: "896000" },
      { token: "keyword.operator", foreground: "3056A4" },
      { token: "type.identifier", foreground: "3056A4" },
      { token: "type", foreground: "3056A4" },
      { token: "string", foreground: "426B39" },
      { token: "string.escape", foreground: "9B4D17" },
      { token: "number", foreground: "9B4D17" },
      { token: "identifier", foreground: "173153" },
      { token: "delimiter", foreground: "4C6080" },
      { token: "operator", foreground: "3056A4" },
    ],
    colors: {
      "editor.background": "#FFFCF4",
      "editor.foreground": "#173153",
      "editor.lineHighlightBackground": "#FBF4DF",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#738098",
      "editorLineNumber.activeForeground": "#896000",
      "editorCursor.foreground": "#3056A4",
      "editor.selectionBackground": "#BFDBFE",
      "editor.inactiveSelectionBackground": "#DFEAF8",
      "editor.selectionHighlightBackground": "#BFDBFE66",
      "editorIndentGuide.background1": "#E5DECB",
      "editorIndentGuide.activeBackground1": "#9A8960",
      "editorBracketMatch.background": "#FAC52E33",
      "editorBracketMatch.border": "#896000",
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
    <Panel className="sandbox-code">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex gap-2" role="group" aria-label="Language">
          {LANGUAGES.map((item) => <button key={item.id} aria-pressed={lang === item.id}
            className={`sandbox-button ${lang === item.id ? "is-active" : ""}`}
            onClick={() => { setLang(item.id); onChange?.(item.id, codes[item.id]); }}>{item.label}</button>)}
        </div>
        <button className="sandbox-button" onClick={() => handleChange(starterCode[lang])}>Reset</button>
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
