import { Link } from "react-router-dom";
import DuckHead from "../layout/DuckHead";
export default function EmptyProgress() {
  return <section className="progress-card flex flex-col items-center py-16 text-center"><DuckHead className="mb-5 w-24" /><h2>No interviews yet.</h2><p className="progress-muted mt-3">Finish one to start tracking your progress!</p><Link to="/interview" className="mt-6 rounded-xl bg-[#3054ed] px-6 py-3 text-sm font-medium text-white hover:bg-[#2443c9]">Start an interview</Link></section>;
}
