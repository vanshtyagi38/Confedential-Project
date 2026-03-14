import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import UserChatPage from "./pages/UserChatPage";
import RechargePage from "./pages/RechargePage";
import ChatsListPage from "./pages/ChatsListPage";
import EarnPage from "./pages/EarnPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCompanions from "./pages/admin/AdminCompanions";
import AdminConversations from "./pages/admin/AdminConversations";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminStats from "./pages/admin/AdminStats";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminWishlist from "./pages/admin/AdminWishlist";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminApiAnalytics from "./pages/admin/AdminApiAnalytics";
import SupportPage from "./pages/SupportPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Component that initializes presence tracking
const PresenceTracker = ({ children }: { children: React.ReactNode }) => {
  usePresence();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PresenceTracker>
            <Routes>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/user-chat/:roomId" element={<ProtectedRoute><UserChatPage /></ProtectedRoute>} />
              <Route path="/recharge" element={<ProtectedRoute><RechargePage /></ProtectedRoute>} />
              <Route path="/chats" element={<ProtectedRoute><ChatsListPage /></ProtectedRoute>} />
              <Route path="/earn" element={<ProtectedRoute><EarnPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="companions" element={<AdminCompanions />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="conversations" element={<AdminConversations />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="stats" element={<AdminStats />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="wishlist" element={<AdminWishlist />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="api-analytics" element={<AdminApiAnalytics />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </PresenceTracker>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
