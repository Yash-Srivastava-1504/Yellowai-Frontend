import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchOrCreateProfile } from "@/lib/userData";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo.png";

function destinationForProfile(onboardingCompleted: boolean | null | undefined) {
  return onboardingCompleted === true ? "/dashboard" : "/onboarding";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (authLoading || !session || !profile) return;
    navigate(profile.onboarding_completed ? "/dashboard" : "/onboarding", { replace: true });
  }, [authLoading, session, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    const u = sess.session?.user;
    if (!u) {
      setLoading(false);
      toast.error("Could not establish a session. Try again.");
      return;
    }
    try {
      const row = await fetchOrCreateProfile(supabase, u.id, u.email);
      toast.success("Welcome back");
      navigate(destinationForProfile(row.onboarding_completed), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load your profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const emailTrim = email.trim();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailTrim,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.session?.user) {
      try {
        const row = await fetchOrCreateProfile(supabase, data.session.user.id, data.session.user.email);
        setLoading(false);
        toast.success("Account created");
        navigate(destinationForProfile(row.onboarding_completed), { replace: true });
      } catch (err) {
        setLoading(false);
        toast.error(err instanceof Error ? err.message : "Could not load your profile");
      }
      return;
    }
    const { error: signInErr, data: signInData } = await supabase.auth.signInWithPassword({
      email: emailTrim,
      password,
    });
    if (!signInErr && signInData.session?.user) {
      try {
        const row = await fetchOrCreateProfile(supabase, signInData.session.user.id, signInData.session.user.email);
        setLoading(false);
        toast.success("Welcome!");
        navigate(destinationForProfile(row.onboarding_completed), { replace: true });
      } catch (err) {
        setLoading(false);
        toast.error(err instanceof Error ? err.message : "Could not load your profile");
      }
      return;
    }
    setLoading(false);
    toast.error(
      "Turn off email confirmation in Supabase: Authentication → Providers → Email → disable “Confirm email”, then try again.",
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (session && profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-6 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center gap-2 text-lg font-bold tracking-tight text-foreground">
              <img src={Logo} alt="AgentForge" className="h-9 w-auto drop-shadow-sm" />
              AgentForge
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your journey</p>
          </div>

          {!configured && (
            <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
              <AlertTitle className="text-amber-900 dark:text-amber-200">Configure Supabase</AlertTitle>
              <AlertDescription className="text-amber-800/90 dark:text-amber-100/80 text-sm">
                Create <code className="text-xs bg-muted px-1 rounded">manah-mindful-muse/.env</code> with{" "}
                <code className="text-xs bg-muted px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="text-xs bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code> from your Supabase
                project settings (API), then restart the dev server.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Account</CardTitle>
              <CardDescription>Your credentials are stored securely in Supabase Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        required
                        disabled={!configured || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(ev) => setPassword(ev.target.value)}
                          required
                          disabled={!configured || loading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!configured || loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        required
                        disabled={!configured || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(ev) => setPassword(ev.target.value)}
                          required
                          minLength={6}
                          disabled={!configured || loading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">At least 6 characters</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={!configured || loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
