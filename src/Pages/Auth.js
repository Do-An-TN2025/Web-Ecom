import { useState } from "react";
import { loginService, registerService } from "../services/AuthService";

export default function Auth() {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await loginService(loginData);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Đăng nhập thành công!");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await registerService(registerData);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Đăng ký thành công!");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* --- Đăng nhập --- */}
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-center">Đăng nhập</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email của bạn"
              name="email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, [e.target.name]: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
            />
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              name="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, [e.target.name]: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Đăng nhập
            </button>
          </form>
        </div>

        {/* --- Đăng ký --- */}
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-center">
            Đăng ký thành viên mới
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tên"
                name="firstName"
                value={registerData.firstName}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
              />
              <input
                type="text"
                placeholder="Họ"
                name="lastName"
                value={registerData.lastName}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  [e.target.name]: e.target.value,
                })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              name="phone"
              value={registerData.phone}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  [e.target.name]: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              name="password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  [e.target.name]: e.target.value,
                })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Đăng ký
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
