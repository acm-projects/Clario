import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function Dashboard() {
  const navigate = useNavigate(); // ✅ hook called inside the component

  const handleClick = () => {     // ✅ handler defined inside the component
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-orange-100">
      <h1 className="text-3xl font-bold text-blue-500">
        Welcome to your Dashboard
      </h1>
      <Button onClick={handleClick}>Log out</Button>
    </div>
  );
}

export default Dashboard;