import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function Navbar() {
  const navigate = useNavigate(); 

  const handleClick = () => {
    navigate("/dashboard"); // path to dashboard once clicked
  };

  return (
    <nav>
      <Button onClick={handleClick}>Join Today</Button> // once button is clicked, go to dashboard
    </nav>
  );
}

export default Navbar;