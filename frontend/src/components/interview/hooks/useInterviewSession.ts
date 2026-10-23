import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { getProblem, runTests } from "../../../api/interview";
import { fakeProblem, type Language, type Problem, type TestsResponse } from "../../../types";

type LoadState = "loading" | "ready" | "not-found" | "server-error";

export function useInterviewSession() {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [language, setLanguage] = useState<Language>("python3");
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<TestsResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProblem() {
      setProblem(null);
      setLoadState("loading");
      setRunResult(null);
      setRunError(null);

      if (!problemId) {
        setLoadState("not-found");
        return;
      }

      try {
        setProblem(await getProblem(problemId, controller.signal));
        setLoadState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (problemId === fakeProblem.slug) {
          setProblem(fakeProblem);
          setLoadState("ready");
          return;
        }
        setLoadState(
          error instanceof ApiError && error.status === 404
            ? "not-found"
            : "server-error",
        );
      }
    }

    void loadProblem();
    return () => controller.abort();
  }, [problemId]);

  async function runCode() {
    if (!problem) {
      setRunError("Problem data is not available.");
      return;
    }

    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const sourceCode = code || problem.starter_code[language];
      setRunResult(await runTests({ slug: problem.slug, language, code: sourceCode }));
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unable to run code.");
    } finally {
      setRunning(false);
    }
  }

  return {
    problem,
    loadState,
    language,
    code,
    runResult,
    runError,
    running,
    setLanguage,
    setCode,
    runCode,
  };
}
