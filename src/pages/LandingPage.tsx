import React, { useEffect } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, ArrowRight, 
  Zap, Scale, LayoutTemplate, HelpCircle, Target, TrendingUp, ShieldCheck 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGoToAuth: () => void;
  isLoggedIn?: boolean;
}

export function LandingPage({ onGoToAuth, isLoggedIn = false }: LandingPageProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'ResumeCraft – Get Past ATS & Land More Interviews';
    
    const addedMetas: HTMLMetaElement[] = [];
    const setMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
        addedMetas.push(meta);
      }
      meta.setAttribute('content', content);
    };

    setMeta('description', 'Optimize your resume with AI: get an instant ATS score, targeted keyword suggestions, and job-specific edits to land more interviews. Try it free!');
    setMeta('og:title', 'ResumeCraft – Land More Interviews', true);
    setMeta('og:description', 'Boost your resume with AI: instantly match it to job descriptions, get an ATS score, and increase interview callbacks. Try free!', true);
    setMeta('og:type', 'website', true);

    // JSON-LD Schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Resume Optimizer",
      "description": "AI-powered resume optimization tool that improves ATS compatibility and boosts interview chances.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "offers": [
        { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" },
        { "@type": "Offer", "price": "0.00", "priceCurrency": "INR" }
      ]
    });
    document.head.appendChild(schemaScript);

    return () => {
      document.title = previousTitle;
      addedMetas.forEach(meta => {
        if (document.head.contains(meta)) {
          document.head.removeChild(meta);
        }
      });
      if (document.head.contains(schemaScript)) {
        document.head.removeChild(schemaScript);
      }
    };
  }, []);

  const features = [
    {
      title: "ATS Optimization",
      desc: "Tailor your resume to beat Applicant Tracking Systems by matching each job's keywords.",
      icon: <Target size={24} strokeWidth={1.5} />
    },
    {
      title: "AI-Powered Tailoring",
      desc: "Our AI instantly identifies and adds missing skills and keywords to align with your target job.",
      icon: <Sparkles size={24} strokeWidth={1.5} />
    },
    {
      title: "Instant Resume Score",
      desc: "Get an ATS compatibility score and instant feedback on formatting, structure, and keywords.",
      icon: <CheckCircle2 size={24} strokeWidth={1.5} />
    },
    {
      title: "Boost Interview Chances",
      desc: "Improve your hiring chances. Users report noticing increased interest from recruiters with targeted resumes.",
      icon: <TrendingUp size={24} strokeWidth={1.5} />
    }
  ];

  const modes = [
    { name: "Quick", credits: 2, icon: <Zap size={24} strokeWidth={1.5} />, desc: "Fast, single-pass edits for key ATS boosts. Ideal for quick keyword fixes." },
    { name: "Balanced", credits: 5, icon: <Scale size={24} strokeWidth={1.5} />, desc: "Two-pass edit for a thorough resume improvement. Perfect for general use." },
    { name: "Deep", credits: 8, icon: <LayoutTemplate size={24} strokeWidth={1.5} />, desc: "Full multi-pass rewrite for maximum impact. Best for your dream job applications." },
  ];

  const pricing = [
    { name: "Free", price: "₹0 / $0", credits: "10 initial credits", slots: "3 Resume Slots", cta: "Start Free" },
    { name: "Monthly", price: "₹149 / $4.99", credits: "60 credits / month", slots: "10 Resume Slots", cta: "Subscribe Monthly", popular: true },
    { name: "Career Sprint", price: "₹399 / $12.99", credits: "180 credits (60×3)", slots: "10 Resume Slots", cta: "Subscribe Quarterly" },
  ];

  const faqs = [
    { q: "How does the AI resume optimizer work?", a: "Our AI reads your resume just like an ATS would, scoring it against the target job description. It automatically rewrites and adds keywords to improve your match rate." },
    { q: "Do credits expire?", a: "No, credits never expire and accumulate. They remain available for whenever you need them as long as your account is active." },
    { q: "What file formats are supported?", a: "Upload PDFs or Word (.docx) files. We parse both formats at ATS-grade accuracy, though many ATS parse .docx files more reliably." },
    { q: "Is my resume data private and secure?", a: "Yes. All uploads are transmitted over secure connections. Your resume is stored only as long as needed to process your request." },
  ];

  const testimonials = [
    { text: "I uploaded my resume and got a detailed report quickly. The AI suggestions helped me add the right keywords, and I noticed an uptick in interview calls.", author: "Priya S.", role: "Product Manager" },
    { text: "I used the Deep mode on my developer resume. The result was excellent – it significantly improved my resume score and highlighted my skills effectively.", author: "Rajesh K.", role: "Software Engineer" },
    { text: "As a recent grad, I was struggling to stand out. Resume Optimizer let me refine my resume easily. The interface is super intuitive, and I soon landed interviews.", author: "Anjali M.", role: "Graduate" },
    { text: "A great tool. The AI did the hard work of rewriting bullet points and adding keywords I missed. It definitely helped me put my best foot forward.", author: "Vikram R.", role: "Marketing Specialist" }
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 lg:px-12 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="h-10 w-auto object-contain" alt="Resume Optimizer Logo" />
          <span className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">
            Resume Optimizer
          </span>
        </div>
        <nav aria-label="Main Navigation">
          <button
            onClick={onGoToAuth}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
          >
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-6xl px-6 lg:px-12 py-20 lg:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              Boost Interview Chances
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-[1.05] tracking-tight mb-8">
              AI-Powered <br />
              <span className="italic font-normal text-zinc-700 dark:text-zinc-300">Resume Optimizer</span>
            </h1>
            <p className="font-serif text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Instantly tailor your resume for any job and beat the bots. Get an instant ATS score, targeted keyword suggestions, and job-specific edits.
            </p>
            <button
              onClick={onGoToAuth}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Start Free (10 Credits)'}
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </section>

        {/* Benefits Section */}
        <section className="w-full bg-white dark:bg-zinc-900 py-24 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Why use Resume Optimizer?
              </h2>
              <p className="font-serif text-zinc-600 dark:text-zinc-400">
                Data-driven enhancements that actually get you hired.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex flex-col items-start"
                >
                  <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-5 text-zinc-900 dark:text-zinc-100">
                    {feature.icon}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-24 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                How It Works
              </h2>
              <p className="font-serif text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                Get an ATS-optimized resume in three simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
                className="p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col"
              >
                <div className="w-10 h-10 mb-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                  <span className="font-mono text-lg font-bold text-zinc-50 dark:text-zinc-900">1</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                  Upload Resume
                </h3>
                <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Provide your current resume (PDF or Word) and the target job description to get started.
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
                className="p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col"
              >
                <div className="w-10 h-10 mb-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                  <span className="font-mono text-lg font-bold text-zinc-50 dark:text-zinc-900">2</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                  Get ATS Score
                </h3>
                <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Our AI analyzes your resume against the job description and provides an instant compatibility score.
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}
                className="p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col"
              >
                <div className="w-10 h-10 mb-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                  <span className="font-mono text-lg font-bold text-zinc-50 dark:text-zinc-900">3</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                  AI Optimizes
                </h3>
                <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The AI rewrites bullet points and adds missing keywords, giving you a tailored resume ready to apply.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Modes Section */}
        <section className="w-full py-24 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Three Modes to Fit Your Needs
              </h2>
              <p className="font-serif text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                In each mode, the AI parses your resume like top ATS do and adds missing keywords. Choose the level of optimization you need.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modes.map((mode, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-zinc-900 dark:text-zinc-100">
                      {mode.icon}
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                      {mode.credits} Credits
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                    {mode.name}
                  </h3>
                  <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {mode.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-24 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Simple, Flexible Pricing
              </h2>
              <p className="font-serif text-zinc-600 dark:text-zinc-400">
                Start free. Subscribe monthly or quarterly, or top up anytime — credits never expire.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {pricing.map((plan, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`p-8 border ${plan.popular ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-800/50 shadow-xl z-10 lg:scale-105' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'} relative`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-[10px] font-mono uppercase tracking-widest font-bold">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                    {plan.name}
                  </h3>
                  <div className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                    {plan.price}
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-serif text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 size={16} className="text-zinc-900 dark:text-zinc-100" />
                      {plan.credits}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-serif text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 size={16} className="text-zinc-900 dark:text-zinc-100" />
                      {plan.slots}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-serif text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 size={16} className="text-zinc-900 dark:text-zinc-100" />
                      Credits never expire
                    </li>
                  </ul>
                  <button
                    onClick={onGoToAuth}
                    className={`w-full py-3 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors ${plan.popular ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900' : 'bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'}`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="mt-12 text-center text-sm font-serif text-zinc-500">
              Also offering one-time refill packs: Starter (20 credits) for ₹99 / $2.99 and Pro (60 credits) for ₹249 / $7.99.
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Loved by Jobseekers
              </h2>
              <p className="font-serif text-zinc-600 dark:text-zinc-400">
                Join thousands who have landed their dream roles with our AI optimizer.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-4 text-emerald-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} aria-hidden="true" className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="font-serif italic text-zinc-700 dark:text-zinc-300 mb-6 leading-relaxed">
                      "{t.text}"
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t.author}</p>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-24 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-4 items-start">
                    <HelpCircle size={20} className="text-zinc-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                        {faq.q}
                      </h4>
                      <p className="text-sm font-serif text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Final CTA Section */}
      <section className="w-full bg-zinc-50 dark:bg-zinc-950 py-32 border-t border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
            Ready to land your next interview?
          </h2>
          <button
            onClick={onGoToAuth}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-xs font-bold transition-all hover:scale-105 active:scale-95"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Start Free (10 Credits)'}
            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="mb-8 flex items-center justify-center gap-2">
            <img src="/logo.png" className="h-8 w-auto object-contain" alt="Resume Optimizer Logo" />
            <span className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">
              Resume Optimizer
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms of Service</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Contact</a>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-500">
            © {new Date().getFullYear()} Resume Optimizer
          </p>
        </div>
      </footer>
    </div>
  );
}
