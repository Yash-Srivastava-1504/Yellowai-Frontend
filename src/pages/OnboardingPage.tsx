import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { type CompanionType, type GenderType, companions, getSuggestedCompanions, setStoredCompanion, setStoredGender } from "@/lib/companion";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/userData";

const concerns = [
  { label: "Exam/Academic Stress", emoji: "📚" },
  { label: "Family Pressure", emoji: "🏠" },
  { label: "Career Anxiety", emoji: "💼" },
  { label: "Relationship Issues", emoji: "💔" },
  { label: "Feeling Lonely", emoji: "😔" },
  { label: "General Anxiety", emoji: "😰" },
  { label: "Just Need to Talk", emoji: "💬" },
  { label: "Not Sure Yet", emoji: "🤷" },
];

const moodEmojis = ["😢", "😟", "😐", "🙂", "😊"];
const moodLabels = ["Very Bad", "Bad", "Okay", "Good", "Great"];
const languages = [
  { value: "en", label: "English", desc: "Full English" },
  { value: "hi", label: "हिंदी", desc: "Pure Hindi" },
  { value: "hinglish", label: "Hinglish", desc: "Mix of both — recommended" },
];
const genderOptions: { value: GenderType; label: string; emoji: string }[] = [
  { value: "male", label: "Male", emoji: "👦" },
  { value: "female", label: "Female", emoji: "👧" },
  { value: "other", label: "Other", emoji: "🌈" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [mood, setMood] = useState(2);
  const [language, setLanguage] = useState("hinglish");
  const [notifications, setNotifications] = useState(true);
  const [notifTime, setNotifTime] = useState("evening");
  const [gender, setGender] = useState<GenderType | null>(null);
  const [companion, setCompanion] = useState<CompanionType | null>(null);
  const totalSteps = 6;

  const toggleConcern = (l: string) => setSelectedConcerns((p) => p.includes(l) ? p.filter((c) => c !== l) : [...p, l]);
  const handleGenderSelect = (g: GenderType) => { setGender(g); if (!companion) setCompanion(getSuggestedCompanions(g)[0]); };

  const finish = async () => {
    if (!user) {
      toast.error("You need to be signed in.");
      return;
    }
    const client = getSupabase();
    if (!client) {
      toast.error("App is not configured for cloud save.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(client, user.id, {
        ...(gender ? { gender } : {}),
        ...(companion ? { companion } : {}),
        language,
        concerns: selectedConcerns,
        initial_mood: mood,
        notifications_enabled: notifications,
        notif_time: notifTime,
        onboarding_completed: true,
      });
      if (companion) setStoredCompanion(companion);
      if (gender) setStoredGender(gender);
      await refreshProfile();
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save onboarding");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else void finish();
  };
  const canContinue = () => { if (step === 1) return selectedConcerns.length > 0; if (step === 2) return gender !== null && companion !== null; return true; };
  const suggestedOrder = gender ? getSuggestedCompanions(gender) : (["didi", "bhaiya", "friend"] as CompanionType[]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-mono">Step {step + 1} of {totalSteps}</p>
            {step > 0 && step < totalSteps - 1 && (
              <button type="button" onClick={() => void finish()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div className="text-center">
                  <p className="text-5xl mb-6">🌿</p>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">Hi, I'm Manah</h1>
                  <p className="text-muted-foreground leading-relaxed">Your virtual friend — always here to listen, support, and help you feel better.</p>
                  <p className="text-sm text-muted-foreground mt-4 bg-surface rounded-xl px-4 py-3">
                    🕐 This only takes <strong className="text-foreground">2 minutes</strong>
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">What brings you here?</h2>
                  <p className="text-sm text-muted-foreground mb-6">Select all that apply — helps us personalize your experience</p>
                  <div className="grid grid-cols-1 gap-2">
                    {concerns.map((c) => {
                      const sel = selectedConcerns.includes(c.label);
                      return (
                        <button key={c.label} onClick={() => toggleConcern(c.label)}
                          className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm transition-all border ${
                            sel ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/10"
                          }`}>
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{c.emoji}</span>
                            {c.label}
                          </span>
                          {sel && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">Choose your companion</h2>
                  <p className="text-sm text-muted-foreground mb-6">Who would you feel most comfortable talking to?</p>
                  <div className="mb-6">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">I am</p>
                    <div className="flex gap-2">
                      {genderOptions.map((g) => (
                        <button key={g.value} onClick={() => handleGenderSelect(g.value)}
                          className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
                            gender === g.value ? "border-primary/30 bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                          }`}>
                          <span>{g.emoji}</span> {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">I'd prefer</p>
                  <div className="space-y-2">
                    {suggestedOrder.map((type) => {
                      const c = companions[type];
                      const isSel = companion === type;
                      const isSug = gender && getSuggestedCompanions(gender)[0] === type;
                      return (
                        <button key={type} onClick={() => setCompanion(type)}
                          className={`w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all border ${
                            isSel ? "border-primary/30 bg-primary/5" : "border-border hover:border-foreground/10"
                          }`}>
                          <span className="text-2xl">{c.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground">· {c.subtitle}</span>
                              {isSug && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Suggested</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">You can change this anytime in settings</p>
                </div>
              )}

              {step === 3 && (
                <div className="text-center">
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">How are you feeling right now?</h2>
                  <p className="text-sm text-muted-foreground mb-10">Be honest — there's no wrong answer</p>
                  <div className="flex justify-center gap-6 mb-4">
                    {moodEmojis.map((e, i) => (
                      <button key={i} onClick={() => setMood(i)}
                        className={`text-4xl transition-all duration-200 hover:scale-110 ${mood === i ? "scale-125" : "opacity-30 hover:opacity-60"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-foreground">{moodLabels[mood]}</p>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">Preferred language</h2>
                  <p className="text-sm text-muted-foreground mb-6">All options are fully supported in chat</p>
                  <div className="space-y-2">
                    {languages.map((l) => (
                      <button key={l.value} onClick={() => setLanguage(l.value)}
                        className={`w-full rounded-xl p-4 text-left text-sm transition-all border flex items-center justify-between ${
                          language === l.value ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        <div>
                          <p className="font-medium">{l.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                        </div>
                        {language === l.value && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Daily check-in reminders?</h2>
                  <p className="text-sm text-muted-foreground mb-6">A gentle nudge to log your mood and reflect</p>
                  <div className="flex items-center justify-between mb-5 p-4 rounded-xl border border-border">
                    <span className="text-sm text-foreground font-medium">Daily reminders</span>
                    <button onClick={() => setNotifications(!notifications)}
                      className={`w-10 h-5.5 rounded-full relative transition-colors ${notifications ? "bg-primary" : "bg-border"}`}>
                      <div className={`w-4 h-4 rounded-full absolute top-[3px] transition-transform ${notifications ? "translate-x-[22px] bg-primary-foreground" : "translate-x-[3px] bg-muted-foreground"}`} />
                    </button>
                  </div>
                  {notifications && (
                    <div className="p-4 rounded-xl border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Best time for you</p>
                      <div className="flex gap-2">
                        {[
                          { key: "morning", emoji: "🌅" },
                          { key: "afternoon", emoji: "☀️" },
                          { key: "evening", emoji: "🌙" },
                        ].map((t) => (
                          <button key={t.key} onClick={() => setNotifTime(t.key)}
                            className={`flex-1 rounded-lg py-2.5 text-xs font-medium capitalize transition-all border flex items-center justify-center gap-1.5 ${
                              notifTime === t.key ? "border-primary/30 bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                            }`}>
                            <span>{t.emoji}</span> {t.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 text-center">Changeable anytime in settings</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 pb-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="rounded-full p-3 border border-border text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={next} disabled={!canContinue() || saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium disabled:opacity-20 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            {saving ? "Saving…" : step === totalSteps - 1 ? "Let's Go! 🚀" : step === 0 ? "Let's Start" : "Continue"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}