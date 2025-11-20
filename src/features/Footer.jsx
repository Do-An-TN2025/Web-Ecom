import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
	return (
		<footer className="mt-12 bg-gray-100 text-gray-700">
			<div className="max-w-screen-lg mx-auto px-6 py-10">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div>
						<div className="text-2xl font-black">SHOPNOW</div>
						<div className="mt-4 text-sm text-gray-600">© All rights reserved SHOPNOW COMPANY LIMITED</div>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3">CHÍNH SÁCH</h4>
						<ul className="text-sm space-y-2 text-gray-600">
							<li><Link to="#" className="hover:underline">Chính sách bảo mật</Link></li>
							<li><Link to="#" className="hover:underline">Chính sách Giao hàng & Đổi trả</Link></li>
							<li><Link to="#" className="hover:underline">Quy định sử dụng</Link></li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3">HỖ TRỢ KHÁCH HÀNG</h4>
						<ul className="text-sm space-y-2 text-gray-600">
							<li><Link to="#" className="hover:underline">Tìm kiếm</Link></li>
							<li><Link to="#" className="hover:underline">Đăng nhập</Link></li>
							<li><Link to="#" className="hover:underline">Đăng ký</Link></li>
							<li><Link to="#" className="hover:underline">Giỏ hàng</Link></li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3">ĐĂNG KÝ NHẬN TIN</h4>
						<p className="text-sm text-gray-600 mb-3">Nhận thông tin khuyến mãi và sản phẩm mới nhất.</p>
						<form className="flex gap-2">
							<input type="email" placeholder="Nhập email của bạn" className="flex-1 px-3 py-2 border rounded-md text-sm" />
							<button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm">Đăng ký</button>
						</form>

						<div className="mt-4 flex items-center gap-3">
							<a href="#" aria-label="facebook" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">f</a>
							<a href="#" aria-label="instagram" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">ig</a>
							<a href="#" aria-label="youtube" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">yt</a>
							<a href="#" aria-label="tiktok" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">tt</a>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-gray-200">
				<div className="max-w-screen-lg mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
					<div>FAST WINGS DELIVERY - Giao hàng hoả tốc</div>
					<div className="mt-2 md:mt-0">SPECIAL GIFTS - Quà tặng bất ngờ</div>
					<div className="mt-2 md:mt-0">CERTIFIED BY ANGELS - Kiểm định kỹ lượng</div>
				</div>
			</div>
		</footer>
	);
}
