import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Mockup from "./mockup";

// Use our mockup for now to avoid circular dependencies
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Mockup />
    <Toaster />
  </QueryClientProvider>
);
