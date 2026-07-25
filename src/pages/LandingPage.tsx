import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, MessageCircle, Brain, Zap, Code2, Layers, GitBranch, Bot } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const features = [
  { icon: Bot, title: "Custom AI Agents", desc: "Create multiple agents, each with its own name, purpose, and system prompt." },
  { icon: Brain, title: "System Prompts", desc: "Define behavior precisely — set tone, rules, persona, and response style for each agent." },
  { icon: MessageCircle, title: "Real-time Streaming", desc: "Responses stream token-by-token via SSE for a snappy, low-latency chat experience." },
  { icon: Shield, title: "Secure by Design", desc: "Supabase Row Level Security ensures users only ever see their own agents and chats." },
  { icon: Layers, title: "Multi-Project", desc: "Organize your work — build separate agents for different use cases, all in one place." },
  { icon: GitBranch, title: "Prompt Versioning", desc: "Every prompt change is recorded. Extend or revert to any previous version." },
];

const useCases = [
  { emoji: "🤝", title: "Customer Support", desc: "Train an agent with your product docs and FAQ to handle tier-1 support." },
  { emoji: "🧑‍💻", title: "Code Reviewer", desc: "Set strict code quality rules and let your agent review PRs with precision." },
  { emoji: "📝", title: "Content Drafter", desc: "Give your agent your brand voice and generate blog posts, emails, and copy." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 bg-background/90 backdrop-blur-lg border-b border-border/40">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground" id="nav-logo">
            <Bot className="w-7 h-7 text-primary" />
            AgentForge
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Use Cases"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" id="nav-login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              to="/login"
              id="nav-get-started"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[92vh] flex items-center justify-center pt-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/10"
          >
            <Bot className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            Powered by Google Gemini via OpenRouter
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={1}
            className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight"
          >
            Build your own{" "}
            <span className="text-primary">AI agents.</span>
            <br />
            No code required.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={2}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
          >
            AgentForge lets you create custom AI agents, give each one a unique system prompt, and chat with them instantly — all secured with your account.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/login"
              id="hero-cta"
              className="rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              Start building for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="rounded-full border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeIn}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A full-stack platform built for speed, security, and extensibility.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
                custom={i * 0.5}
                className="rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeIn}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Built for any use case</h2>
            <p className="text-muted-foreground">The same platform, infinitely flexible.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {useCases.map((u, i) => (
              <motion.div
                key={u.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
                custom={i * 0.5}
                className="rounded-2xl border border-border/60 bg-card p-6 text-center hover:border-primary/20 transition-colors"
              >
                <div className="text-3xl mb-4">{u.emoji}</div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{u.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeIn}
            custom={0}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Get started in 3 steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {[
                { step: "1", title: "Create an account", desc: "Register in seconds with your email." },
                { step: "2", title: "Build an agent", desc: "Name it and write a system prompt." },
                { step: "3", title: "Start chatting", desc: "Chat with your agent — it follows your rules." },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-border/60 bg-card p-6">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mx-auto mb-3">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeIn}
          custom={0}
          className="max-w-2xl mx-auto rounded-3xl bg-primary/5 border border-primary/10 p-12 text-center"
        >
          <Bot className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Ready to build your first agent?</h2>
          <p className="text-muted-foreground mb-8">Free to use. No credit card required.</p>
          <Link
            to="/login"
            id="footer-cta"
            className="rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Bot className="w-4 h-4 text-primary" />
            AgentForge
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Secured with Supabase Auth + JWT · Built with FastAPI + React
          </div>
          <p>© {new Date().getFullYear()} AgentForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}