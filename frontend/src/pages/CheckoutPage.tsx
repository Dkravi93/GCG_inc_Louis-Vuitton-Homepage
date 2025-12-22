import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import {
  Truck,
  Shield,
  Check,
  MapPin,
  Mail,
  User,
  Phone,
} from "lucide-react";
import { cartItemsAtom, cartTotalAtom } from "../store/cart";
import { useNavigate } from "react-router-dom";
import PayUCheckout from "../components/PayUCheckout";
import { showToastAtom } from "../store/ui";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: "standard" | "express" | "overnight";
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes: string;
  saveInfo: boolean;
  newsletter: boolean;
}

const SHIPPING_METHODS = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "5-7 business days",
    price: 0,
    threshold: 2000,
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "2-3 business days",
    price: 199,
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    description: "Next business day",
    price: 499,
  },
];

export default function CheckoutPage() {
  const [cartItems] = useAtom(cartItemsAtom);
  const [cartTotal] = useAtom(cartTotalAtom);
  const [, showToast] = useAtom(showToastAtom);
  const navigate = useNavigate();
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    shippingMethod: "standard",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "IN",
    },
    notes: "",
    saveInfo: false,
    newsletter: false,
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/");
    }
  }, [cartItems, navigate]);

  const selectedShipping = SHIPPING_METHODS.find(
    (m) => m.id === formData.shippingMethod
  )!;
  const shippingCost =
    selectedShipping.threshold && cartTotal >= selectedShipping.threshold
      ? 0
      : selectedShipping.price;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shippingCost + tax;

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear related errors
    const updatedErrors = { ...errors };
    Object.keys(updates).forEach((key) => {
      delete updatedErrors[key as keyof FormData];
    });
    setErrors(updatedErrors);
  };

  const validateStep = (currentStep: typeof step): boolean => {
    const newErrors: Partial<FormData> = {};

    if (currentStep === "shipping") {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (!formData.address) newErrors.address = "Address is required";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.state) newErrors.state = "State is required";
      if (!formData.postalCode)
        newErrors.postalCode = "Postal code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === "shipping") setStep("payment");
    }
  };

  // Prepare order data for PayU checkout
  const prepareOrderData = () => {
    const orderItems = cartItems.map((item) => ({
      product: item.id,
      variant: item.variant || {
        color: "default",
        size: "default",
        sku: `${item.id}-default`,
      },
      quantity: item.quantity,
      price: item.price,
    }));

    return {
      items: orderItems,
      shippingAddress: {
        street:
          formData.address +
          (formData.address2 ? `, ${formData.address2}` : ""),
        city: formData.city,
        state: formData.state,
        zipCode: formData.postalCode,
        country: formData.country,
      },
      billingAddress: formData.billingAddress.street
        ? formData.billingAddress
        : {
            street:
              formData.address +
              (formData.address2 ? `, ${formData.address2}` : ""),
            city: formData.city,
            state: formData.state,
            zipCode: formData.postalCode,
            country: formData.country,
          },
      phone: formData.phone,
      notes: formData.notes,
    };
  };

  const handlePaymentSuccess = (orderId: string) => {
    showToast({ message: "Order placed successfully!", type: "success" });
    navigate("/checkout/success", { state: { orderId } });
  };

  const handlePaymentError = (error: string) => {
    showToast({ message: error, type: "error" });
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 py-16">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {["shipping", "payment"].map((s, index) => {
              const isActive = s === step;
              const isCompleted = ["shipping", "payment"].indexOf(step) > index;

              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "border text-neutral-900"
                        : isActive
                        ? "border bg-neutral-300"
                        : "border text-neutral-500"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <div
                    className={`ml-3 text-sm font-medium`}
                  >
                    {s === "shipping" && "Shipping"}
                    {s === "payment" && "Payment"}
                  </div>
                  {index < 1 && (
                    <div
                      className={`ml-8 h-0.5 w-16 ${
                        isCompleted ? "bg-green-500" : "bg-neutral-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-16">
          {/* Main Content */}
          <div>
            {/* Shipping Information */}
            {step === "shipping" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-extralight mb-2">
                    Shipping Information
                  </h2>
                  <p className="text-white/60">
                    Enter your shipping details below
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        updateFormData({ firstName: e.target.value })
                      }
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                        errors.firstName
                          ? "border-red-500 focus:border-red-400"
                          : "border-white/20 focus:border-white/40"
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        updateFormData({ lastName: e.target.value })
                      }
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                        errors.lastName
                          ? "border-red-500 focus:border-red-400"
                          : "border-white/20 focus:border-white/40"
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        updateFormData({ email: e.target.value })
                      }
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                        errors.email
                          ? "border-red-500 focus:border-red-400"
                          : "border-white/20 focus:border-white/40"
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        updateFormData({ phone: e.target.value })
                      }
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                        errors.phone
                          ? "border-red-500 focus:border-red-400"
                          : "border-white/20 focus:border-white/40"
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        updateFormData({ address: e.target.value })
                      }
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                        errors.address
                          ? "border-red-500 focus:border-red-400"
                          : "border-white/20 focus:border-white/40"
                      }`}
                      placeholder="123 Main Street"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.address2}
                      onChange={(e) =>
                        updateFormData({ address2: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:border-white/40 focus:outline-none"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          updateFormData({ city: e.target.value })
                        }
                        className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                          errors.city
                            ? "border-red-500 focus:border-red-400"
                            : "border-white/20 focus:border-white/40"
                        }`}
                        placeholder="New York"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          updateFormData({ state: e.target.value })
                        }
                        className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                          errors.state
                            ? "border-red-500 focus:border-red-400"
                            : "border-white/20 focus:border-white/40"
                        }`}
                        placeholder="NY"
                      />
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) =>
                          updateFormData({ postalCode: e.target.value })
                        }
                        className={`w-full rounded-lg border bg-white/5 px-4 py-3 backdrop-blur transition-colors focus:outline-none ${
                          errors.postalCode
                            ? "border-red-500 focus:border-red-400"
                            : "border-white/20 focus:border-white/40"
                        }`}
                        placeholder="10001"
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Methods */}
                <div>
                  <h3 className="text-xl font-light mb-4">Shipping Method</h3>
                  <div className="space-y-3">
                    {SHIPPING_METHODS.map((method) => {
                      const cost =
                        method.threshold && cartTotal >= method.threshold
                          ? 0
                          : method.price;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                            formData.shippingMethod === method.id
                              ? "border-white bg-white/10"
                              : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.id}
                              checked={formData.shippingMethod === method.id}
                              onChange={(e) =>
                                updateFormData({
                                  shippingMethod: e.target
                                    .value as FormData["shippingMethod"],
                                })
                              }
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-white/60">
                                {method.description}
                              </div>
                            </div>
                          </div>
                          <div className="font-medium">
                            {cost === 0 ? "FREE" : `₹${cost.toFixed(2)}`}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full border mx-auto px-8 py-3 font-medium transition-all hover:bg-white/90 hover:scale-105"
                  >
                    Continue to Checkout
                  </button>
                </div>
              </motion.div>
            )}

            {/* Payment */}
            {step === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-extralight mb-2">Checkout</h2>
                  <p className="text-white/60">
                    You will be redirected to PayU to complete your payment
                  </p>
                </div>

                <PayUCheckout
                  orderData={prepareOrderData()}
                  total={total}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setStep("shipping")}
                    className="rounded-full border border-white/20 px-8 py-3 font-medium transition-colors hover:bg-white/10"
                  >
                    Back to Shipping
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-light mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={
                        item.image ||
                        `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop&sig=${item.id}`
                      }
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-white/60">
                        Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="text-sm text-white/60 text-center">
                    +{cartItems.length - 3} more items
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="">Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="">Shipping</span>
                  <span className={shippingCost === 0 ? "text-green-400" : ""}>
                    {shippingCost === 0
                      ? "FREE"
                      : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="">Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-8 text-xs text-white/60">
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="h-6 w-6" />
                    <span>Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="h-6 w-6" />
                    <span>Free Ship</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="h-6 w-6" />
                    <span>Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
