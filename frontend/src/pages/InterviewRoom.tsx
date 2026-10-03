import { useState } from "react";
import Editor from "@monaco-editor/react";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

type RunResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
};

export default function InterviewRoom() {
  const [code, setCode] = useState<string>("# Write your solution here\n");
  const [language, setLanguage] = useState<"python" | "java">("python");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCode = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiBaseUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });

      if (!res.ok) {
        setError(`Request failed with status ${res.status}.`);
        return;
      }

      const data: RunResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Interview Room</h1>

      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Language:
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "python" | "java")}
            className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </label>
      </div>

      <Editor
        height="500px"
        language={language}
        value={code}
        onChange={(value) => setCode(value ?? "")}
        theme="vs-dark"
      />

      {/* Run button below the sandbox */}
      <div className="mt-3 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={runCode}
          disabled={running}
          className="cursor-pointer rounded bg-[#0070f3] px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Running..." : "▶ Run"}
        </button>
      </div>

      {/* Output section */}
      <div className="mt-3 overflow-hidden rounded border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Output
          </h2>
          {result && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                result.exit_code === 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}
            >
              exit {result.exit_code}
            </span>
          )}
        </div>

        <div className="h-40 overflow-auto bg-black p-3 text-left font-mono text-sm">
          {error ? (
            <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
          ) : result && (result.stdout || result.stderr) ? (
            <>
              {result.stdout && (
                <pre className="whitespace-pre-wrap text-green-300">
                  {result.stdout}
                </pre>
              )}
              {result.stderr && (
                <pre className="whitespace-pre-wrap text-red-400">
                  {result.stderr}
                </pre>
              )}
            </>
          ) : result ? (
            <p className="text-gray-400">(no output)</p>
          ) : running ? (
            <p className="text-gray-400">Running your code...</p>
          ) : (
            <p className="text-gray-400">
              Click “Run” to execute your code and see the output here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}