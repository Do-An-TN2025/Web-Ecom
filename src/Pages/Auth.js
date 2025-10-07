import { useState, useEffect, useCallback } from "react";
import { loginService, registerService, socialLoginService } from "../services/AuthService";
import { toast } from "react-toastify";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

/* ---------- Firebase Init (single) ---------- */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
};
const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({ display: "popup" });
facebookProvider.addScope("public_profile");
facebookProvider.addScope("email");

/* ---------- Reusable UI ---------- */
const TextInput = ({
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true
}) => (
  <div className="flex flex-col gap-1">
    <input
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete || "off"}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-black/80 focus:ring-2 focus:ring-black/30"
    />
  </div>
);

const PasswordInput = ({ name, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={name === "loginPassword" ? "current-password" : "new-password"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 select-none"
        tabIndex={-1}
      >
        {show ? "Ẩn" : "Hiện"}
      </button>
    </div>
  );
};

/* ---------- Component ---------- */
export default function Auth() {
  const [tab, setTab] = useState("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Loading
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // Helper redirect chung
  const redirectAfterAuth = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/account/profile";
      }
    } catch {
      window.location.href = "/account/profile";
    }
  };

  /* Redirect fallback (Facebook popup blocked) */
  useEffect(() => {
    (async () => {
      try {
        const redirectCred = await getRedirectResult(auth);
        if (redirectCred) {
          const idToken = await redirectCred.user.getIdToken(true);
          await socialLoginService(idToken);
          toast.success("Đăng nhập Facebook thành công!");
          redirectAfterAuth(); // CHANGED
        }
      } catch (e) {
        console.error("Redirect error:", e);
      }
    })();
  }, []);

  /* ---- Handlers ---- */
  const handleLoginSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loginLoading) return;
      setLoginLoading(true);
      try {
        await loginService({ email: loginEmail, password: loginPassword });
        toast.success("Đăng nhập thành công!");
        redirectAfterAuth(); // CHANGED
      } catch (err) {
        toast.error(err.response?.data?.message || "Đăng nhập thất bại");
      } finally {
        setLoginLoading(false);
      }
    },
    [loginEmail, loginPassword, loginLoading]
  );

  const handleRegisterSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (registerLoading) return;
      setRegisterLoading(true);
      try {
        await registerService({
          firstName,
          lastName,
          email: regEmail,
          phone,
          password: regPassword
        });
        toast.success("Đăng ký thành công!");
        redirectAfterAuth(); // CHANGED (giữ nếu muốn tự vào profile; vẫn check admin)
      } catch (err) {
        toast.error(err.response?.data?.message || "Đăng ký thất bại");
      } finally {
        setRegisterLoading(false);
      }
    },
    [firstName, lastName, regEmail, phone, regPassword, registerLoading]
  );

  const doGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken(true);
      await socialLoginService(idToken);
      toast.success("Đăng nhập Google thành công!");
      redirectAfterAuth(); // CHANGED
    } catch (e) {
      console.error(e);
      toast.error("Google lỗi");
    } finally {
      setGoogleLoading(false);
    }
  };

  const doFacebook = async () => {
    if (facebookLoading) return;
    setFacebookLoading(true);
    try {
      const cred = await signInWithPopup(auth, facebookProvider);
      const idToken = await cred.user.getIdToken(true);
      await socialLoginService(idToken);
      toast.success("Đăng nhập Facebook thành công!");
      redirectAfterAuth(); // CHANGED
    } catch (e) {
      if (e.code === "auth/popup-blocked") {
        toast.info("Chuyển hướng...");
        await signInWithRedirect(auth, facebookProvider);
      } else if (e.code === "auth/popup-closed-by-user") {
        toast.info("Đã đóng cửa sổ.");
      } else {
        toast.error("Facebook lỗi: " + (e.code || "unknown"));
      }
    } finally {
      setFacebookLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,#ffe9b5,transparent_60%),radial-gradient(circle_at_80%_70%,#c7d6ff,transparent_55%),linear-gradient(135deg,#ffffff,#f5f7fa)]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 md:flex-row md:gap-12">
        {/* Left */}
        <div className="mb-10 w-full md:mb-0 md:w-1/2">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">
            Chào mừng trở lại
          </h1>
          <p className="mt-4 max-w-md text-base text-gray-600">
            Đăng nhập hoặc tạo tài khoản để theo dõi đơn hàng, lưu địa chỉ và nhận ưu đãi.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs font-medium text-gray-600">
            {["Bảo mật", "Nhanh chóng", "Tiện lợi"].map((t) => (
              <div key={t} className="rounded-lg border border-gray-200 bg-white/70 p-3 backdrop-blur">
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="w-full md:w-1/2">
          <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-md md:p-8">
            {/* Tabs */}
            <div className="mb-8 flex rounded-full bg-gray-100 p-1 text-sm font-medium">
              {[
                { key: "login", label: "Đăng nhập" },
                { key: "register", label: "Đăng ký" }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-full px-4 py-2 transition ${
                    tab === t.key ? "bg-black text-white shadow" : "text-gray-500 hover:text-gray-900"
                  }`}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Social */}
            <div className="mb-6 flex flex-col gap-3">
              <button
                onClick={doGoogle}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="google"
                  className="h-5 w-5"
                />
                {googleLoading ? "Đang xử lý..." : "Tiếp tục với Google"}
              </button>
              <button
                onClick={doFacebook}
                disabled={facebookLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#1877F2] bg-[#1877F2]/90 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-[2px] hover:bg-[#1877F2] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"
                  alt="facebook"
                  className="h-5 w-5 invert brightness-0"
                />
                {facebookLoading ? "Đang xử lý..." : "Tiếp tục với Facebook"}
              </button>
            </div>

            <div className="relative my-6">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 px-3 text-[10px] font-semibold tracking-widest text-gray-400">
                HOẶC EMAIL
              </span>
            </div>

            {tab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                <TextInput
                  name="loginEmail"
                  type="email"
                  value={loginEmail}
                  placeholder="Email"
                  autoComplete="email"
                  onChange={setLoginEmail}
                />
                <PasswordInput
                  name="loginPassword"
                  value={loginPassword}
                  placeholder="Mật khẩu"
                  onChange={setLoginPassword}
                />
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            )}

            {tab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    name="firstName"
                    value={firstName}
                    placeholder="Tên"
                    onChange={setFirstName}
                  />
                  <TextInput
                    name="lastName"
                    value={lastName}
                    placeholder="Họ"
                    onChange={setLastName}
                  />
                </div>
                <TextInput
                  name="regEmail"
                  type="email"
                  value={regEmail}
                  placeholder="Email"
                  autoComplete="email"
                  onChange={setRegEmail}
                />
                <TextInput
                  name="phone"
                  type="tel"
                  value={phone}
                  placeholder="Số điện thoại"
                  required={false}
                  onChange={setPhone}
                />
                <PasswordInput
                  name="regPassword"
                  value={regPassword}
                  placeholder="Mật khẩu"
                  onChange={setRegPassword}
                />
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registerLoading ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-[11px] leading-relaxed text-gray-500">
              Khi tiếp tục, bạn đồng ý với điều khoản & chính sách bảo mật của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}