import { BrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./Routes";
import Header from "./features/Header/Header";
import Loading from "./components/Loading";
import ChatBot from "./features/ChatBot";
import Footer from "./features/Footer";
import { WishlistProvider } from "./hooks/useWishlist";

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");


  useEffect(() => {
  const legacy = localStorage.getItem("token");
  if (legacy && !localStorage.getItem("auth_token")) {
    localStorage.setItem("auth_token", legacy);
    localStorage.removeItem("token");
  }
}, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {isLoading && <Loading />}
      {!isAdminRoute && <Header />}
      <main className={!isAdminRoute ? 'pt-[40px] md:pt-[60px]' : ''}>
        <AppRoutes />
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatBot />}
    </div>
  );
}
  

export default function App() {
  return (
      <AppContent />
  );
}