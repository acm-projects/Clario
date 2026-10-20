export const interviewModes = [
  { id: "company-specific", title: "Company specific", description: "Practice a problem selected for the company you are preparing for." },
  { id: "custom", title: "Custom", description: "Bring your chosen problem and shape your own interview." },
  { id: "surprise-me", title: "Surprise me", description: "Try an unexpected problem and think on your feet." },
  { id: "recommended", title: "Recommended", description: "Work on a problem matched to your starting difficulty." },
] as const;
export type InterviewMode = typeof interviewModes[number]["id"];
export function isInterviewMode(value: unknown): value is InterviewMode {
  return interviewModes.some(mode => mode.id === value);
}
