import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, User, Search, X } from "lucide-react";
import { useAtom } from "jotai";
import { cartCountAtom, cartDrawerOpenAtom } from "../store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, getImageUrl } from "../lib/api";
import { useAtomValue, useSetAtom } from "jotai";
import { authUserAtom, setAuthAtom, clearAuthAtom } from "../store/auth";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hoverUser, setHoverUser] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const setAuth = useSetAtom(setAuthAtom);
  const clearAuth = useSetAtom(clearAuthAtom);
  const user = useAtomValue(authUserAtom);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function quickLogin() {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      setAuth({ token: res.token, user: res.user });
      setHoverUser(false);
      setEmail("");
      setPassword("");
    } catch {
      setError("Invalid credentials");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  }

  const [count] = useAtom(cartCountAtom);
  const [open, setOpen] = useAtom(cartDrawerOpenAtom);

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none absolute inset-0 from-black/40 to-transparent"></div>
      <div className="relative">
        <nav
          className={
            "mx-auto flex max-w-7xl items-center justify-between px-6 py-4 transition-all duration-300 "
          }
        >
          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 left-0 w-full bg-white dark:bg-neutral-900 shadow-md md:hidden"
              >
                <div className="flex flex-col items-start px-6 py-4 space-y-4 text-sm uppercase">
                  <Link to="/collections" onClick={() => setIsMenuOpen(false)}>
                    Collections
                  </Link>
                  <a href="#story" onClick={() => setIsMenuOpen(false)}>
                    Story
                  </a>
                  <a href="#support" onClick={() => setIsMenuOpen(false)}>
                    Support
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Link to="/" className="font-semibold tracking-widest">
            GCG
          </Link>

          <div className="hidden gap-8 text-sm uppercase md:flex">
            <Link to="/collections" className="hover:opacity-80">
              Collections
            </Link>
            <a href="#story" className="hover:opacity-80">
              Story
            </a>
            <a href="#support" className="hover:opacity-80">
              Support
            </a>
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center gap-5">
            {/* your search, cart, user profile code unchanged */}
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-96"
              >
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search luxury eyewear..."
                    className="w-full rounded-full border border-white/20 backdrop-blur px-6 py-3 pr-12  focus:border-white/40 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-5">
            <button
              aria-label="Search"
              className="hover:opacity-80"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={20} />
            </button>
            <button
              aria-label="Cart"
              className="relative"
              onClick={() => setOpen(!open)}
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                  {count}
                </span>
              )}
            </button>
            <div
              className="relative"
              onMouseEnter={() => setHoverUser(true)}
              onMouseLeave={() => setHoverUser(false)}
            >
              <button aria-label="Account" className="flex items-center gap-2">
                {user?.avatarUrl ? (
                  <img
                    src={getImageUrl(user.avatarUrl)}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
                {user?.firstName && (
                  <span className="hidden text-xs md:inline">
                    {user.firstName}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {hoverUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur"
                  >
                    <div className="mb-3 text-sm font-medium">
                      {user ? "Account" : "Welcome"}
                    </div>
                    {!user && (
                      <div className="grid gap-3">
                        <input
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 focus:outline-none"
                          placeholder="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm  focus:outline-none"
                          placeholder="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                          <div className="text-xs text-red-400">{error}</div>
                        )}
                        <button
                          type="button"
                          className="rounded-full px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                          onClick={quickLogin}
                        >
                          Login
                        </button>
                      </div>
                    )}
                    {user && (
                      <div className="grid gap-2">
                        <div className="mb-2 flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={getImageUrl(user.avatarUrl)}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs">
                              {(user.firstName?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-[10px]">{user.email}</div>
                          </div>
                        </div>
                        {(user.role === "admin" ||
                          user.role === "superadmin") && (
                          <Link
                            to="/admin"
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
                          >
                            Admin
                          </Link>
                        )}
                        <Link
                          to="/account"
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
                        >
                          Account
                        </Link>
                        <button
                          onClick={() => {
                            clearAuth();
                            setHoverUser(false);
                          }}
                          className="rounded-lg border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/10"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                    {!user && (
                      <div className="mt-3 text-xs">
                        New here?{" "}
                        <Link to="/register" className="underline">
                          Create an account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
        <div
          className={
            "absolute inset-0 top-0 -z-10 h-16 w-full border-b border-white/10 transition-opacity duration-300 " +
            (scrolled ? "opacity-100 backdrop-blur" : "opacity-0")
          }
        />
      </div>
    </div>
  );
}
