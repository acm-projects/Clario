import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Assessment from "./pages/Assessment";
import InterviewSelection from "./pages/InterviewSelection";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProblemLibrary from "./pages/ProblemLibrary";
import Feedback from "./pages/Feedback";
import ProfileGate from "./components/auth/ProfileGate";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/problems" element={<ProblemLibrary />} />
      <Route path="/report" element={<Feedback />} />      <Route element={<ProfileGate />}>
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<InterviewSelection />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Settings />} />      </Route>
    </Routes>
  );
}

export default App;
