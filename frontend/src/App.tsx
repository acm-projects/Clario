import RepoDebugging from "./pages/RepoDebugging";
import Progress from "./pages/Progress";
import SystemDesign from "./pages/SystemDesign";
import { useAppearance } from "./lib/appearance";
import { brandTheme } from "./lib/theme";
import { Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Assessment from "./pages/Assessment";
import InterviewSelection from "./pages/InterviewSelection";
import InterviewRoom from "./pages/InterviewRoom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProblemLibrary from "./pages/ProblemLibrary";
import Feedback from "./pages/Feedback";
import InterviewReport from "./pages/InterviewReport";
import ProfileGate from "./components/auth/ProfileGate";

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
      <Route path="/report" element={<Feedback />} />
      <Route path="/report/preview" element={<InterviewReport preview />} />
      <Route path="/report/:sessionId" element={<InterviewReport />} />
      <Route element={<ProfileGate />}>
        <Route path="/progress" element={<Progress />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<InterviewSelection />} />
        <Route path="/interview/:problemId" element={<InterviewRoom />} />
        <Route path="/repo-debugging" element={<RepoDebugging />} />
        <Route path="/interview/repo" element={<RepoDebugging />} />
        <Route path="/interview/repo/:slug" element={<RepoDebugging />} />
        <Route path="/interview/system-design/:slug" element={<SystemDesign />} />
        <Route path="/system-design" element={<SystemDesign />} />
        <Route path="/repo-debugging/:challengeId" element={<RepoDebugging />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Settings />} />
      </Route>
    </Routes>
  );
  return sandbox ? routes : <div data-appearance={appearance} className={brandTheme}>{routes}</div>;
}

export default App;
