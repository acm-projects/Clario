import { lazy, Suspense } from "react";
import { useAppearance } from "./lib/appearance";
import { brandTheme } from "./lib/theme";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import InterviewEntry from "./components/interview/InterviewEntry";
import ProfileGate from "./components/auth/ProfileGate";

const RepoDebugging = lazy(() => import("./pages/RepoDebugging"));
const Progress = lazy(() => import("./pages/Progress"));
const SystemDesign = lazy(() => import("./pages/SystemDesign"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Assessment = lazy(() => import("./pages/Assessment"));
const InterviewSelection = lazy(() => import("./pages/InterviewSelection"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const ProblemLibrary = lazy(() => import("./pages/ProblemLibrary"));
const InterviewReport = lazy(() => import("./pages/InterviewReport"));

function App() {
  const appearance = useAppearance();
  const { pathname } = useLocation();
  const sandbox = pathname.startsWith("/repo-debugging") || pathname.startsWith("/interview/repo") || /^\/interview\/[^/]+\/?$/.test(pathname);
  const routes = (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/problems" element={<ProblemLibrary />} />
      <Route path="/report" element={<Navigate to="/progress" replace />} />
      <Route path="/report/preview" element={<InterviewReport preview />} />
      <Route path="/report/:sessionId" element={<InterviewReport />} />
      <Route element={<ProfileGate />}>
        <Route path="/progress" element={<Progress />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<InterviewSelection />} />
        <Route path="/interview/:problemId" element={<InterviewEntry key={pathname}><InterviewRoom /></InterviewEntry>} />
        <Route path="/repo-debugging" element={<RepoDebugging />} />
        <Route path="/interview/repo" element={<RepoDebugging />} />
        <Route path="/interview/repo/:slug" element={<InterviewEntry key={pathname}><RepoDebugging /></InterviewEntry>} />
        <Route path="/interview/system-design/:slug" element={<InterviewEntry key={pathname}><SystemDesign /></InterviewEntry>} />
        <Route path="/system-design" element={<SystemDesign />} />
        <Route path="/repo-debugging/:challengeId" element={<InterviewEntry key={pathname}><RepoDebugging /></InterviewEntry>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Settings />} />
      </Route>
    </Routes>
  );
  const content = <Suspense fallback={<main role="status" className="flex min-h-svh items-center justify-center bg-cream-gradient text-sm text-[#687087]">Loading...</main>}>{routes}</Suspense>;
  return sandbox ? content : <div data-appearance={appearance} className={brandTheme}>{content}</div>;
}

export default App;