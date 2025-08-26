import Header from "../features/Header";
import Hero from "../features/Hero";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />

      {/* Nội dung sau Hero */}
      <div className="h-[2000px] bg-gray-100">
        <p className="p-6">Chưa có nd </p>
      </div>
    </div>
  );
}
