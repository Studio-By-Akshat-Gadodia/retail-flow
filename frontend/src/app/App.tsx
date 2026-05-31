import { BrowserRouter } from "react-router-dom";
import Providers from "@/app/Providers";
import Router from "@/app/Router";
import PWAPrompts from "@/app/PWAPrompts";

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Router />
        <PWAPrompts />
      </BrowserRouter>
    </Providers>
  );
}
