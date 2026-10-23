export const dashboardTourSteps = [
  { target: "welcome", selector: "#dashboard-welcome", tag: "WELCOME", title: "Your dashboard", copy: "Start an interview, find a challenge, and track your progress here." },
  { target: "launch", selector: "#dashboard-launch", tag: "PRACTICE", title: "Start an interview", copy: "Choose an interview mode, pick a challenge, and explain your thinking as you solve it." },
  { target: "recommendation", selector: "#dashboard-recommendation", tag: "NEXT UP", title: "Your next problem", copy: "Try your recommended challenge, or browse the Problem library in the sidebar." },
  { target: "skills", selector: "#dashboard-skills", tag: "FEEDBACK", title: "Your skill signal", copy: "Your interview feedback builds a picture of your coding, communication, and reasoning skills." },
  { target: "calendar", selector: "#dashboard-calendar", tag: "ACTIVITY", title: "Your practice streak", copy: "Completed interviews appear on the calendar. Use Progress to revisit feedback and Settings to update your preferences." },
] as const;
