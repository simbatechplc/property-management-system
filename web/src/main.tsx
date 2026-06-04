import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n"; // must be imported before App
import App from "./App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider.tsx";
import TanstackQueryProvider from "./providers/tanstack-query-provider.tsx";
import { Provider } from "react-redux";
import { store } from "./store/index.ts";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TanstackQueryProvider>
        <ThemeProvider defaultTheme="light">
          <Provider store={store}>
            <App />
            <Toaster position={'top-center'}/>
          </Provider>
        </ThemeProvider>
      </TanstackQueryProvider>
    </BrowserRouter>
  </StrictMode>
);
