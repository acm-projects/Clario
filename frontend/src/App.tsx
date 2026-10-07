import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewSelection from "./pages/InterviewSelection";
import Settings from "./pages/Settings";
import ProfileGate from "./components/ProfileGate";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProfileGate />}>
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Settings />} />
        <Route path="/interview" element={<InterviewSelection />} />
        <Route path="/interview/:problemId" element={<InterviewRoom />} />
      </Route>
    </Routes>
  );
}

export default App;
