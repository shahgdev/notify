import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Record from "./pages/Record";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import LectureDetail from "./pages/LectureDetail";
import GraphPage from "./pages/GraphPage";
import Learn from "./pages/Learn";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/library" element={<Library />} />
              <Route path="/record" element={<Record />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/lecture/:id" element={<LectureDetail />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
