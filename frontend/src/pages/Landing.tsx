import { Link } from "react-router-dom";
import Button from "../components/Button";

function Landing() {
  return (
    <div className="flex items-center justify-center h-screen bg-orange-100">
      {/* Navigation Bar */}
      <Link to="/login">Login</Link>
      <Link to="/signup">Signup</Link>

        {/* Main Content */}
      <div className="text-center">
        
        <h1 className="text-4xl font-bold text-blue-500 mb-4">Welcome to the Landing Page</h1>
      </div>
    </div>
  );
}







export default Landing;