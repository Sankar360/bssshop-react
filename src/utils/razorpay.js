// src/utils/razorpay.js
let razorpayPromise = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => {
      razorpayPromise = null;
      reject(new Error("Razorpay failed to load"));
    };
    document.body.appendChild(s);
  });

  return razorpayPromise;
}