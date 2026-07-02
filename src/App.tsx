import React, { useEffect } from 'react';
import { useResumeStore } from './store/useResumeStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EditorPage } from './pages/EditorPage';
import { ResumesPage } from './pages/ResumesPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SecurityPage } from './pages/SecurityPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { PricingPage } from './pages/PricingPage';
import { PaymentWaitingPage } from './pages/PaymentWaitingPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailedPage } from './pages/PaymentFailedPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from './components/Toaster';
import { FeedbackWidget } from './components/FeedbackWidget';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { RefundPolicyPage } from './pages/legal/RefundPolicyPage';
import { ContactPage } from './pages/legal/ContactPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { currentPage, fetchResumes, fetchHistory, fetchCredits, fetchEntitlement, fetchSubscription } = useResumeStore();
  const { session, initialized, initialize, recoveryMode, clearRecoveryMode } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (session) {
      fetchResumes();
      fetchHistory();
      fetchCredits();
      fetchEntitlement();
      fetchSubscription();
    }
  }, [fetchResumes, fetchHistory, fetchCredits, fetchEntitlement, fetchSubscription, session]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (recoveryMode) {
    return <PasswordRecoveryPage onComplete={clearRecoveryMode} />;
  }

  if (!session) {
    // No marketing landing here — the standalone marketing site owns that.
    // Unauthenticated visitors go straight to auth; arrivals carrying the
    // marketing CTA param (?src=marketing) open on the sign-up tab.
    const fromMarketing =
      new URLSearchParams(window.location.search).get('src') === 'marketing';
    return <AuthPage initialMode={fromMarketing ? 'signup' : 'login'} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pb-8">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'editor' && <EditorPage />}
        {currentPage === 'resumes' && <ResumesPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'security' && <SecurityPage />}
        {currentPage === 'subscription' && <SubscriptionPage />}
        {currentPage === 'pricing' && <PricingPage />}
        {currentPage === 'payment_waiting' && <PaymentWaitingPage />}
        {currentPage === 'payment_success' && <PaymentSuccessPage />}
        {currentPage === 'payment_failed' && <PaymentFailedPage />}
        {currentPage === 'transactions' && <TransactionHistoryPage />}
        {currentPage === 'privacy' && <PrivacyPolicyPage />}
        {currentPage === 'terms' && <TermsPage />}
        {currentPage === 'refund' && <RefundPolicyPage />}
        {currentPage === 'contact' && <ContactPage />}
      </main>
      
      <Footer />
      <Toaster />
      <FeedbackWidget />
    </div>
  );
}
