import Header from "../features/Header/Header";

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
    </div>
  );
}

