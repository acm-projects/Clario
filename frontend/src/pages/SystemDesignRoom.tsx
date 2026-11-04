
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getSystemDesignQuestions } from "../lib/api";
import type { SystemDesignQuestion } from "../lib/api";
import { useAppearance } from "../lib/appearance";

import { SystemDesignQuestionPanel } from "../components/interview/SystemDesignQuestionPanel";
import { VideoCallPanel } from "../components/interview/VideoCallPanel";
import { ResizableSplit } from "../components/interview/ResizableSplit";

import { TopBar } from "../components/interview/TopBar";
import { setAppearance } from "../lib/appearance";

import "../components/interview/interview.css";

export default function SystemDesignRoom() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const theme = useAppearance();

  const [question, setQuestion] =
    useState<SystemDesignQuestion | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [designNotes, setDesignNotes] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestion() {
      setLoading(true);
      setError(null);
      setQuestion(null);

      if (!slug) {
        setError("No System Design question selected.");
        setLoading(false);
        return;
      }

      try {
        // The existing API requires a company.
        // Search the supported companies for the selected slug.
        const companies = [
          "Airbnb",
          "Bumble",
          "DoorDash",
          "Spotify",
          "Stripe",
        ];

        for (const company of companies) {
          const result = await getSystemDesignQuestions(
            company,
            controller.signal
          );

          if (controller.signal.aborted) return;

          const match = result.questions.find(
            (item) => item.slug === slug
          );

          if (match) {
            setQuestion(match);
            return;
          }
        }

        setError("System Design question not found.");
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load System Design question.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadQuestion();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading System Design interview...
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error ?? "Question unavailable."}</p>
        <button
          onClick={() => navigate("/interview?mode=system_design")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Back to System Design
        </button>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className="interview-page system-design-sandbox flex h-screen flex-col overflow-hidden bg-[var(--page-bg)] text-[var(--text-main)]"
      style={{
        ...({
          "--page-bg": theme === "dark" ? "#0a1120" : "#fbf4df",
          "--panel-bg": theme === "dark" ? "#0f1a2e" : "#ffffff",
          "--line": theme === "dark" ? "#34445e" : "#292929",
          "--text-main": theme === "dark" ? "#f4f7fc" : "#173153",
          "--text-body": theme === "dark" ? "#c3cde0" : "#254268",
          "--text-muted": theme === "dark" ? "#8a97ad" : "#587096",
          "--surface": theme === "dark" ? "#1a2842" : "#fbf4df",
          "--video-self": theme === "dark" ? "#0c1626" : "#fbf4df",
          "--video-interviewer": "#2378db",
          "--avatar-ring": "#2378db",
        } as React.CSSProperties),
      }}
    >
      <TopBar
        timer="30:00"
        theme={theme}
        modeLabel="System Design"
        onThemeChange={setAppearance}
        onRun={() => { }}
        onSubmit={() => { }}
        showRun={false}
        showSubmit={false}
        listLabel="System Design Questions"
        listPath="/interview?mode=system_design"
      />

      <main className="min-h-0 flex-1 p-4">
        <ResizableSplit
          direction="horizontal"
          storageKey="clario-system-design-call-width"
          initialSize={76}
          label="Resize question and interview call"
          first={
            <div className="flex h-full min-h-0 flex-col">
              <SystemDesignQuestionPanel
                question={question}
                notes={designNotes}
                onNotesChange={setDesignNotes}
              />
            </div>
          }
          second={
            <div className="sandbox-call flex h-full min-h-0 flex-col rounded-[18px] border border-[var(--line)] bg-[var(--panel-bg)] p-4">
              <h2 className="mb-3 text-lg font-semibold">
                Interview call
              </h2>

              <VideoCallPanel
                round="System Design"
                interviewer="AI Interviewer"
                interviewMode="system_design"
                problemSlug={question.slug}
                designNotes={designNotes}
                onEndInterview={() => navigate("/dashboard")}
              />
            </div>
          }
        />
      </main>
    </div>
  );
}
