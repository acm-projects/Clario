import { Link } from "react-router-dom";
import Button from "../components/Button";

function Landing() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 w-screen">
      {/* Navigation Bar */}
      <div className="absolute top-0 left-0 w-screen bg-gray-800 p-4 flex justify-end space-x-4">
        <h1>Clario</h1>
        <Link to="/login" className="text-white hover:text-blue-300">
          Login
        </Link>
        <Link to="/signup" className="text-white hover:text-blue-300">
          Signup
        </Link>
      </div>

        {/* Main Content */}
      <div className="text-center">
        
        <h1 className="text-4xl font-bold text-blue-500 mb-4">ur on the landing page</h1>
      </div>
    </div>
  );
}







export default Landing;