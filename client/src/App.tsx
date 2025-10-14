import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import AIAssessment from "@/pages/AIAssessment";
import { AboutUs } from "@/pages/AboutUs";
import { HowItWorks } from "@/pages/HowItWorks";
import ScoringAdmin from "@/pages/ScoringAdmin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ai-assessment" component={AIAssessment} />
      <Route path="/about" component={AboutUs} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/admin/scoring" component={ScoringAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
