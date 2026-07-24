import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Target, X, Play, RotateCcw } from "lucide-react";

const categories = ["All", "Breathing", "Grounding", "Journaling", "Movement"];

const exercisesList = [
  { id: 1, title: "4-7-8 Breathing", category: "Breathing", duration: "3 min", tag: "Reduces anxiety", emoji: "🌬️",
    description: "A calming breathing pattern that activates your parasympathetic nervous system.",
    steps: ["Exhale completely through your mouth", "Breathe in through your nose for 4 seconds", "Hold your breath for 7 seconds", "Exhale through your mouth for 8 seconds", "Repeat 3-4 times"] },
  { id: 2, title: "5-4-3-2-1 Grounding", category: "Grounding", duration: "5 min", tag: "Stops spiraling", emoji: "🌿",
    description: "Use your five senses to ground yourself in the present moment.",
    steps: ["Name 5 things you can SEE", "Name 4 things you can TOUCH", "Name 3 things you can HEAR", "Name 2 things you can SMELL", "Name 1 thing you can TASTE"] },
  { id: 3, title: "Gratitude Journal", category: "Journaling", duration: "5 min", tag: "Shift mindset", emoji: "📝",
    description: "Writing down things you're grateful for rewires your brain for positivity.",
    steps: ["Find a quiet spot and breathe", "Write 3 things you're grateful for", "For each, write WHY", "Notice how you feel after"] },
  { id: 4, title: "Body Scan", category: "Grounding", duration: "10 min", tag: "Release tension", emoji: "🧘",
    description: "Systematically relax each part of your body to release stored tension.",
    steps: ["Lie down and close your eyes", "Start at the top of your head", "Move attention down through each body part", "Notice and release tension", "End at your toes"] },
  { id: 5, title: "Box Breathing", category: "Breathing", duration: "4 min", tag: "Focus boost", emoji: "📦",
    description: "Equal-length breathing used by Navy SEALs to maintain calm under pressure.",
    steps: ["Breathe in for 4 seconds", "Hold for 4 seconds", "Breathe out for 4 seconds", "Hold for 4 seconds", "Repeat 4-6 times"] },
  { id: 6, title: "Progressive Relaxation", category: "Movement", duration: "8 min", tag: "Better sleep", emoji: "😴",
    description: "Tense and release muscle groups to achieve deep physical relaxation.",
    steps: ["Clench your fists for 5 seconds", "Release and notice the difference", "Move to arms, shoulders, face", "Continue to legs and feet", "End with full body relaxation"] },
];

const phaseConfig = {
  in: { label: "Breathe In", duration: 4, color: "hsl(var(--primary))" },
  hold: { label: "Hold", duration: 7, color: "hsl(var(--warning))" },
  out: { label: "Breathe Out", duration: 8, color: "hsl(var(--success))" },
};

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<typeof exercisesList[0] | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [cycles, setCycles] = useState(0);
  const [timer, setTimer] = useState(4);

  const filtered = exercisesList.filter((e) => (category === "All" || e.category === category) && e.title.toLowerCase().includes(search.toLowerCase()));

  const runPhase = useCallback((p: "in" | "hold" | "out") => {
    setPhase(p);
    setTimer(phaseConfig[p].duration);
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    if (timer <= 0) {
      if (phase === "in") runPhase("hold");
      else if (phase === "hold") runPhase("out");
      else { setCycles(c => c + 1); runPhase("in"); }
      return;
    }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [sessionActive, timer, phase, runPhase]);

  const startSession = () => { setSessionActive(true); setCycles(0); runPhase("in"); };
  const stopSession = () => { setSessionActive(false); setSelected(null); setCycles(0); };

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-6">
      <h1 className="text-xl font-bold tracking-tight text-foreground mb-6">Exercises</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 transition-colors" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 overflow-x-auto">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${category === c ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <button key={ex.id} onClick={() => setSelected(ex)}
            className="rounded-2xl border border-border/60 bg-card p-5 text-left hover:border-primary/20 transition-all hover-lift group">
            <div className="text-2xl mb-3">{ex.emoji}</div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{ex.title}</h3>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ex.duration}</span>
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{ex.tag}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selected && !sessionActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-7 relative">
              <button onClick={() => setSelected(null)} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="text-3xl mb-3">{selected.emoji}</div>
              <h2 className="text-lg font-bold text-foreground mb-1">{selected.title}</h2>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mb-5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.duration}</span>
                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{selected.tag}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{selected.description}</p>
              <ol className="space-y-3 mb-7">
                {selected.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <button onClick={selected.category === "Breathing" ? startSession : () => setSelected(null)}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                {selected.category === "Breathing" ? <><Play className="w-4 h-4" /> Start Session</> : "Got It ✓"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing Session */}
      <AnimatePresence>
        {sessionActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <button onClick={stopSession}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            <p className="text-xs text-muted-foreground font-mono mb-8">Cycle {cycles + 1}</p>

            <div className="relative w-40 h-40 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `3px solid ${phaseConfig[phase].color}`, opacity: 0.15 }}
                animate={{ scale: phase === "out" ? 0.6 : phase === "hold" ? 1 : 1.1 }}
                transition={{ duration: phaseConfig[phase].duration, ease: "easeInOut" }}
              />
              <motion.div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${phaseConfig[phase].color}10` }}
                animate={{ scale: phase === "out" ? 0.5 : phase === "hold" ? 0.9 : 1 }}
                transition={{ duration: phaseConfig[phase].duration, ease: "easeInOut" }}>
                <span className="text-3xl font-light text-foreground font-mono">{timer}</span>
              </motion.div>
            </div>

            <p className="text-lg font-medium text-foreground mt-8">{phaseConfig[phase].label}</p>
            <p className="text-sm text-muted-foreground mt-1">{phaseConfig[phase].duration} seconds</p>

            <button onClick={() => { setCycles(0); runPhase("in"); }}
              className="mt-10 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Restart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}