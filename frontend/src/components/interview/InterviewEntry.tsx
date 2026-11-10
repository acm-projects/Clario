import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

/** Mount the room only after acknowledgement: no camera or voice startup beforehand. */
export default function InterviewEntry({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [read, setRead] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const checkRead = () => {
    const node = content.current;
    if (node && node.scrollHeight - node.scrollTop - node.clientHeight <= 8) setRead(true);
  };
  useEffect(() => {
    if (accepted) return;
    dialog.current?.showModal();
    checkRead();
    const observer = new ResizeObserver(checkRead);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [accepted]);

  if (accepted) return children;
  return <main className="grid min-h-svh place-items-center bg-cream-gradient font-sans text-[#182137]">
    <dialog ref={dialog} aria-labelledby="interview-entry-title" aria-describedby="interview-entry-description" onCancel={event => event.preventDefault()} className="m-auto w-[calc(100%-32px)] max-w-[600px] max-h-[90svh] overflow-hidden rounded-3xl border border-[#e4e2db] bg-[#fffdf8] p-0 text-[#182137] shadow-xl backdrop:bg-[#18213766] backdrop:backdrop-blur-sm">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8"><p className="text-xs font-semibold uppercase tracking-widest text-[#4566ed]">Before you begin</p><h1 id="interview-entry-title" className="mt-3 text-2xl font-semibold">Ready for your interview?</h1><p id="interview-entry-description" className="mt-3 text-sm leading-6 text-[#687087]">Take a moment to review what to expect. Scroll to the end to continue.</p></div>
      <div ref={content} onScroll={checkRead} tabIndex={0} aria-label="Interview information" className="my-5 max-h-[40svh] overflow-y-auto overscroll-contain border-y border-[#e4e2db] px-6 py-5 outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#4566ed] sm:px-8">
        <ul className="list-disc space-y-5 pl-5 text-sm leading-7 marker:text-[#4566ed]">
          <li><strong>Assessment starts when you start.</strong> Clicking Start interview connects the AI interviewer. Your explanations and work during the session inform your feedback.</li>
          <li><strong>Your session is documented.</strong> Spoken answers are transcribed, and available transcripts, submitted code, run results, and session timing are saved for your report. Speak only about information you are comfortable sharing.</li>
          <li><strong>Enable microphone and camera permissions.</strong> Allow access when your browser asks. Your microphone is needed to talk to the interviewer. If your camera is unavailable, the interview can still continue.</li>
          <li><strong>Understand the camera preview.</strong> Clario displays your camera locally; it does not save camera video. Your microphone audio is processed by the voice service to support the conversation.</li>
          <li><strong>Choose a quiet space.</strong> Check your microphone, use headphones if possible, and keep a stable internet connection so you can hear the interviewer clearly.</li>
          <li><strong>Talk through your thinking.</strong> Explain your assumptions, approach, and trade-offs. You can ask clarifying questions and take time to think; the interviewer may give a brief nudge after about 30 seconds of silence.</li>
          <li><strong>Know the controls.</strong> In coding rounds, Run Tests checks your current work. Submit locks your final solution and begins follow-up questions. End Call finishes the session and opens your feedback report.</li>
          <li><strong>Feedback has limits.</strong> AI feedback can make mistakes. Scores reflect the saved interview evidence, and code review estimates are separate from actual test results.</li>
        </ul>
        <p className="mt-6 rounded-xl bg-[#edf1ff] p-4 text-sm leading-6">By starting, you acknowledge that your interview responses and work will be processed and saved for feedback.</p>
      </div>
      <div className="px-6 pb-6 sm:px-8 sm:pb-8"><p aria-live="polite" className="mb-4 text-xs text-[#687087]">{read ? "You're ready to begin." : "Scroll through the information to enable Start interview."}</p><div className="flex items-center justify-between gap-4"><Link to="/interview" className="inline-flex min-h-11 items-center text-sm text-[#687087] hover:underline">Go back</Link><button type="button" disabled={!read} onClick={() => { dialog.current?.close(); setAccepted(true); }} className="min-h-11 rounded-full bg-[#4566ed] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Start interview</button></div></div>
    </dialog>
  </main>;
}
