import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, MessageCircle, Brain, TrendingUp, Zap, Heart, Users } from "lucide-react";
import Logo from "@/assets/Logo.png";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const features = [
  { icon: MessageCircle, title: "24/7 Companion", desc: "Talk anytime — your AI friend adapts to you and never judges." },
  { icon: Brain, title: "Science-Backed", desc: "CBT techniques, mindfulness, and breathing exercises that actually work." },
  { icon: Shield, title: "Fully Private", desc: "Anonymous by default. Your conversations stay yours." },
  { icon: TrendingUp, title: "Track Progress", desc: "Visual mood insights to understand your patterns better." },
  { icon: Heart, title: "Culturally Yours", desc: "Built for Indian Gen Z. Hinglish supported. Stigma-free." },
  { icon: Zap, title: "Instant Help", desc: "No appointments. No waiting rooms. Support when you need it." },
];

const testimonials = [
  { text: "Finally an app that gets it. Didi mode feels like talking to my actual older sister.", name: "Priya, 21", loc: "Delhi" },
  { text: "The breathing exercises helped me before my CA exams. Game changer.", name: "Rahul, 23", loc: "Mumbai" },
  { text: "I love that it's anonymous. No one needs to know I use it.", name: "Ananya, 19", loc: "Bangalore" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 bg-background/90 backdrop-blur-lg border-b border-border/40">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <img src={Logo} alt="Manah Logo" className="h-8 w-auto drop-shadow-sm" />
            Manah
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Stories"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/login" className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[92vh] flex items-center justify-center pt-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Main Hero Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex justify-center mb-10"
          >
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-primary/20 blur-[60px] w-full h-full rounded-full scale-125"></div>
              <img src={Logo} alt="Manah Brand Logo" className="relative h-32 md:h-40 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Free · Private · Made for India</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Your virtual friend,
            <br /><span className="text-primary">always here.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Feeling stressed about exams? Family pressure getting to you? 
            Talk to Manah — a warm, judgment-free AI companion who truly gets you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Start Talking — It's Free <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
              Learn More
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-10 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Encrypted</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Anonymous</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> 10K+ users</span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0} className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need.
              <br /><span className="text-muted-foreground font-normal">Nothing you don't.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={i}
                className="rounded-2xl border border-border/60 bg-card p-7 hover-lift group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 bg-surface">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0} className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple as texting a friend</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Choose your companion", desc: "Pick Didi, Bhaiya, or Friend — whoever you're most comfortable with.", emoji: "🤗" },
              { num: "02", title: "Share what's on your mind", desc: "Talk freely in Hindi, English, or Hinglish. No judgment, ever.", emoji: "💬" },
              { num: "03", title: "Feel better, track progress", desc: "Get coping tools, log mood, and see yourself grow over time.", emoji: "📈" },
            ].map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={i + 1}
                className="text-center md:text-left">
                <div className="text-3xl mb-4">{s.emoji}</div>
                <span className="text-xs font-mono text-primary font-medium">{s.num}</span>
                <h3 className="text-base font-semibold text-foreground mt-1 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0} className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">Stories</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Real people, real relief</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={i + 1}
                className="rounded-2xl border border-border/60 bg-card p-7">
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.loc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-surface">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0}>
            <p className="text-4xl mb-4">🌿</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to feel better?</h2>
            <p className="text-muted-foreground mb-10">Takes 2 minutes to start. No credit card. Fully anonymous.</p>
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Start Your Journey <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-bold text-foreground flex items-center gap-2"><img src={Logo} alt="Manah Logo" className="h-7 w-auto drop-shadow-sm" /> Manah</span>
          <div className="flex gap-6">
            {["About", "Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <span className="text-xs">© 2025 Manah. Made with 💙 in India</span>
        </div>
      </footer>
    </div>
  );
}