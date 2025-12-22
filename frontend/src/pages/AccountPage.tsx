import { useEffect, useState, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { authUserAtom, setAuthAtom } from "../store/auth";
import { authApi, getImageUrl } from "../lib/api";
import { atom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  Moon,
  Sun,
  Monitor,
  Bell,
  Lock,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Settings,
  ChevronRight,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const toastAtom = atom<{ message: string; type: "success" | "error" } | null>(
  null
);

type ActiveTab =
  | "profile"
  | "security"
  | "preferences"
  | "orders"
  | "addresses"
  | "payments";

export default function AccountPage() {
  const [user] = useAtom(authUserAtom);
  const setAuth = useSetAtom(setAuthAtom);
  const [toast, setToast] = useAtom(toastAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme: setAppTheme, actualTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Auto dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      const response = await authApi.updateMe({ firstName, lastName });
      setAuth({ user: response.user });
      setToast({ message: "Profile updated successfully", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      if (activeTab !== "orders") return; // fetch only when orders tab is active
      setLoadingOrders(true);
      try {
        const res = await fetch("/api/orders", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const data = await res.json();
        setOrders(data.orders);
      } catch (err) {
        setToast({ message: "Failed to load orders", type: "error" });
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [activeTab, user]);

  async function onUpdateTheme(newTheme: "light" | "dark" | "system") {
    try {
      setAppTheme(newTheme);
      if (user) {
        const response = await authApi.updatePreferences({ theme: newTheme });
        setAuth({ user: response.user });
      }
      setToast({ message: "Theme updated successfully", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to update theme", type: "error" });
    }
  }

  async function onAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !event.target.files?.length) return;
    const file = event.target.files[0];

    setUploading(true);
    try {
      const response = await authApi.updateAvatar(file);
      setAuth({ user: response.user });
      setToast({ message: "Avatar updated successfully", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to update avatar", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const tabConfig = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "security" as const, label: "Security", icon: Lock },
    { id: "preferences" as const, label: "Preferences", icon: Settings },
    { id: "orders" as const, label: "Order History", icon: Package },
    { id: "addresses" as const, label: "Addresses", icon: MapPin },
    { id: "payments" as const, label: "Payment Methods", icon: CreditCard },
  ];

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="relative">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img
                    src={getImageUrl(user?.avatarUrl)}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white/10"
                    onError={(e) => {
                      console.error("Avatar image failed to load:", {
                        avatarUrl: user?.avatarUrl,
                        fullUrl: getImageUrl(user?.avatarUrl),
                        src: e.currentTarget.src,
                      });
                      // Fallback to default image
                      e.currentTarget.src = "/vite.svg";
                    }}
                    onLoad={() => {
                      console.log("Avatar image loaded successfully:", {
                        avatarUrl: user?.avatarUrl,
                        fullUrl: getImageUrl(user?.avatarUrl),
                      });
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extralight tracking-tight text-white">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-white/70">{user?.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user?.role === "admin" || user?.role === "superadmin"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {user?.role?.charAt(0).toUpperCase() +
                        (user?.role?.slice(1) || "")}
                    </span>
                    <span className="text-xs text-white/50">
                      Member since{" "}
                      {new Date(user?.createdAt || Date.now()).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark/90">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-dark placeholder:text-dark/50 focus:border-white/40 focus:outline-none focus:ring-0 backdrop-blur"
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark/90">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-dark placeholder:text-dark/50 focus:border-white/40 focus:outline-none focus:ring-0 backdrop-blur"
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark/90">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-dark/70 cursor-not-allowed backdrop-blur"
                />
                <p className="text-xs text-dark/50">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark/90">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-dark placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-0 backdrop-blur"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-8">
            {/* Theme Selection */}
            <div className="space-y-4">
              <h3 className="text-xl text-dark mb-6">Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onUpdateTheme(option.value)}
                      className={`relative rounded-xl border p-6 text-left transition-all hover:scale-105 ${
                        isActive
                          ? "border-white/40 bg-white/10"
                          : "border-white/20 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-3 ${
                            isActive ? "bg-white text-black" : "bg-white/10"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-medium text-dark">
                            {option.label}
                          </div>
                          <div className="text-sm text-dark/60">
                            {option.value === "light" && "Light theme"}
                            {option.value === "dark" && "Dark theme"}
                            {option.value === "system" && "Follow system"}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute top-4 right-4">
                          <div className="rounded-full bg-green-500 p-1">
                            <Check className="h-3 w-3 text-dark dark:text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="text-xl font-light text-dark mb-6">
                Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-white/10 p-2">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-dark">
                        Email Notifications
                      </div>
                      <div className="text-sm text-dark/60">
                        Receive order updates via email
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-dark dark:text-white focus:ring-white/20 focus:ring-offset-0"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-white/10 p-2">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-dark">
                        Push Notifications
                      </div>
                      <div className="text-sm text-dark/60">
                        Receive notifications in browser
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-dark dark:text-white focus:ring-white/20 focus:ring-offset-0"
                  />
                </label>
              </div>
            </div>
          </div>
        );

case "orders":
  if (loadingOrders) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/30 border-t-transparent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-dark/40 mb-4" />
        <h3 className="text-xl font-light text-dark mb-2">No Orders Yet</h3>
        <p className="text-dark/60 mb-6">
          You haven't placed any orders yet.
        </p>
        <button className="rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="p-6 rounded-xl border border-white/20 bg-white/5 flex flex-col gap-4 shadow-md"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-dark">
              Order #{order.id}
            </h4>
            <span className="text-sm text-dark/60">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Status + Total */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                order.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : order.status === "delivered"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {order.status}
            </span>
            <span className="text-sm text-dark/70">
              Total: <span className="font-semibold">₹{order.total}</span>
            </span>
          </div>

          {/* Items */}
          <div className="bg-white/10 rounded-lg p-4">
            <h5 className="text-sm font-medium mb-2">Items</h5>
            <ul className="divide-y divide-white/10">
              {order.items?.map((item: any, i: number) => (
                <li key={i} className="py-2 flex justify-between text-sm text-dark/80">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button className="text-sm text-blue-600 hover:underline">
              View Details →
            </button>
          </div>
        </div>
      ))}
    </div>
  );

      case "addresses":
        return (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto text-dark/40 mb-4" />
            <h3 className="text-xl font-light text-dark mb-2">
              No Addresses Saved
            </h3>
            <p className="text-dark/60 mb-6">
              Add shipping addresses for faster checkout.
            </p>
            <button className="rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90">
              Add Address
            </button>
          </div>
        );

      case "payments":
        return (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 mx-auto text-dark/40 mb-4" />
            <h3 className="text-xl font-light text-dark mb-2">
              No Payment Methods
            </h3>
            <p className="text-dark/60 mb-6">
              Add payment methods for faster checkout.
            </p>
            <button className="rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90">
              Add Payment Method
            </button>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-white/20 bg-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-green-500/20 p-3">
                    <Lock className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark">Password</h3>
                    <p className="text-sm text-dark/60">
                      Last updated 30 days ago
                    </p>
                  </div>
                </div>
                <button className="w-full rounded-lg border border-white/20 px-4 py-3 text-dark hover:bg-white/5 transition-colors">
                  Change Password
                </button>
              </div>

              <div className="p-6 rounded-xl border border-white/20 bg-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark">
                      Email Verification
                    </h3>
                    <p className="text-sm text-green-400">Verified</p>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-dark/50 cursor-not-allowed"
                >
                  Email Verified
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        actualTheme === "light" ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/20 text-green-400"
                  : "border-red-500/30 bg-red-500/20 text-red-400"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-extralight tracking-tight mb-4 ${
              actualTheme === "light" ? "text-black" : "text-white"
            }`}
          >
            Account Settings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={
              actualTheme === "light" ? "text-gray-600" : "text-white/70"
            }
          >
            Manage your profile, preferences, and account security
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <nav className="space-y-2">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all hover:scale-105 ${
                      isActive
                        ? actualTheme === "light"
                          ? "bg-black text-white"
                          : "bg-white text-black"
                        : actualTheme === "light"
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3"
          >
            <div
              className={`rounded-2xl border p-8 backdrop-blur ${
                actualTheme === "light"
                  ? "border-gray-200 bg-white/80"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {renderTabContent()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
