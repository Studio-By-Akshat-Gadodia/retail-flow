import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import Providers from "@/app/Providers";
import Router from "@/app/Router";
import PWAPrompts from "@/app/PWAPrompts";

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <BrowserRouter>
          <Router />
          <PWAPrompts />
        </BrowserRouter>
      </Providers>
    </ErrorBoundary>
  );
}
