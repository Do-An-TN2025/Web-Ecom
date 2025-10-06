import { BrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./Routes";
import Header from "./features/Header/Header";
import Loading from "./components/Loading";
import ChatBot from "./features/ChatBot";

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

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
      <main>
        <AppRoutes />
      </main>
        {!isAdminRoute && <ChatBot />}
    </div>
  );
}
  

export default function App() {
  return (
      <AppContent />
  );
}