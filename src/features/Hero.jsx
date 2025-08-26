import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Hero() {
  const slides = [
    {
      id: 1,
      img: "https://buggy.yodycdn.com/images/home-banner-mb/bcf28ba308c0eed938b47fb9b90ff590.webp?width=720&height=1280",
      title: "ĐỒNG GIÁ 99K",
      desc: "TOÀN BỘ CỬA HÀNG - ĐỘC QUYỀN WEBSITE",
    },
    {
      id: 2,
      img: "https://buggy.yodycdn.com/images/home-banner-mb/a9fb6650e5f707f557db26bd3f1bc02b.webp?width=720&height=1280",
      title: "Ta có hẹn với tự do",
      desc: "KỶ NIỆM 80 NĂM NGÀY QUỐC KHÁNH VIỆT NAM",
    },
    {
      id: 3,
      img: "https://buggy.yodycdn.com/images/home-banner-mb/26b9f3b38e508bbcd7a8bcf2b77e361b.webp?width=720&height=1280",
      title: "Sale Rực Rỡ",
      desc: "Giảm giá toàn bộ sản phẩm mùa hè",
    },
  ];

  return (
    <section className="relative w-full h-screen">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="w-full h-full  custom-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-screen">
              {/* Background image */}
              <img
                src={slide.img}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Overlay text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 bg-black/30">
                <h1 className="text-5xl md:text-7xl font-bold mb-4">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl">{slide.desc}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
