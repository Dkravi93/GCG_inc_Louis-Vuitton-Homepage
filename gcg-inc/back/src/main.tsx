import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "jotai";
import AppRoutes from "./routes";
import { Analytics } from "./components/Analytics";
import { ThemeProvider } from "./contexts/ThemeContext";
import Toast from "./components/Toast";
import "./index.css";
import "./utils/performance"; // Initialize performance monitoring

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider>
        <ThemeProvider>
          <BrowserRouter>
            <Analytics />
            <AppRoutes />
            <Toast />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
