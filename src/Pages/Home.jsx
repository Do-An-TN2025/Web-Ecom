import Hero from "../features/Hero";
import { useLocation } from "react-router-dom";
import BestSellers from "../components/Home/BestSellers";
import NewProducts from "../components/Home/NewProducts";

export default function Home() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div>
      {isHomePage && <Hero />}

      <main className="max-w-screen-lg mx-auto px-4">
        <BestSellers />
        <NewProducts />

        {/* placeholder for more sections or content */}
        <div className="h-40" />
      </main>
    </div>
  );
}