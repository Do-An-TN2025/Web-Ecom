import Hero from "../features/Hero";
import { useLocation } from "react-router-dom";

export default function Home() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div>
      {isHomePage && <Hero />}
      <div className="h-[2000px] bg-gray-100">
        <p className="p-6">Chưa có nd </p>
      </div>
    </div>
  );
}