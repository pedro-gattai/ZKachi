import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/app/AppLayout";
import GamePage from "./pages/GamePage";
import PoolPage from "./pages/PoolPage";
import VerifyPage from "./pages/VerifyPage";
import DocsPage from "./pages/DocsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/game" replace />} />
            <Route path="game" element={<GamePage />} />
            <Route path="pool" element={<PoolPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="docs" element={<DocsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
