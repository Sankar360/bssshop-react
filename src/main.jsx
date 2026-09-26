// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { WishlistProvider } from "./context/WishlistContext";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </WishlistProvider>
    </AuthProvider>
  </StrictMode>,
);
