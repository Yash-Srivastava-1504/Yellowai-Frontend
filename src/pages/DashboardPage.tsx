import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, MessageCircle, Smile, Dumbbell, Flame } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const moodData = [
  { day: "Mon", mood: 3 }, { day: "Tue", mood: 2 }, { day: "Wed", mood: 3 },
  { day: "Thu", mood: 4 }, { day: "Fri", mood: 3 }, { day: "Sat", mood: 4 }, { day: "Sun", mood: 5 },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20 lg:pb-6">
      {/* Welcome */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}
        className="rounded-2xl bg-primary/5 border border-primary/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{greeting}, Yash {timeEmoji}</h1>
            <p className="mt-1 text-sm text-muted-foreground">How are you feeling today?</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">5 day streak</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/chat" className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/20 hover:bg-primary/3 transition-all hover-lift col-span-1 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Continue Chat</h3>
          <p className="text-xs text-muted-foreground">I'm here to listen</p>
        </Link>
        <Link to="/mood" className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/20 hover:bg-primary/3 transition-all hover-lift">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
            <Smile className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Log Mood</h3>
          <p className="text-xs text-muted-foreground">Quick check-in</p>
        </Link>
        <Link to="/exercises" className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/20 hover:bg-primary/3 transition-all hover-lift">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Exercises</h3>
          <p className="text-xs text-muted-foreground">Breathe & relax</p>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Streak", value: "5 days", icon: "🔥" },
          { label: "This Week", value: "Improving", extra: "+12%", icon: "📈" },
          { label: "Sessions", value: "23", icon: "💬" },
          { label: "Avg Mood", value: "Good", icon: "😊" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="text-lg mb-2">{s.icon}</div>
            <p className="text-base font-semibold text-foreground">{s.value}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {s.extra && <span className="text-[10px] font-mono text-success font-medium">{s.extra}</span>}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={3} className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground">Your Week</h2>
          <Link to="/mood" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={moodData}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis hide domain={[1, 5]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 12 }} />
              <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>Average: Good</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success" /> Improving</span>
        </div>
      </motion.div>

      {/* Recent */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={4} className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Conversations</h2>
        <div className="space-y-1">
          {[
            { time: "Today, 3:45 PM", preview: "Dealing with exam anxiety...", emoji: "😰" },
            { time: "Yesterday", preview: "Feeling better after our talk...", emoji: "🙂" },
            { time: "2 days ago", preview: "Stressed about placements...", emoji: "😟" },
          ].map((c, i) => (
            <Link key={i} to="/chat" className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors">
              <span className="text-lg">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{c.preview}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{c.time}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Tip */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5}
        className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">💡 Daily Tip</p>
        <p className="text-sm text-foreground leading-relaxed">Take 3 deep breaths before opening your textbooks. It helps your brain switch from "stress mode" to "focus mode."</p>
      </motion.div>
    </div>
  );
}