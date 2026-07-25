import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import {
  createProject,
  fetchProject,
  fetchActivePrompt,
  setProjectPrompt,
  updateProject,
  toQueryError,
} from "@/lib/userData";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  systemPrompt: z.string().max(10000, "Prompt too long").optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateEditProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const isEditing = Boolean(projectId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Load existing project data when editing
  useEffect(() => {
    if (!isEditing || !projectId || !user) return;
    const client = getSupabase();
    if (!client) return;

    Promise.all([fetchProject(client, projectId), fetchActivePrompt(client, projectId)])
      .then(([project, prompt]) => {
        if (!project) {
          toast.error("Project not found.");
          navigate("/projects");
          return;
        }
        reset({
          name: project.name,
          description: project.description ?? "",
          systemPrompt: prompt?.content ?? "",
        });
      })
      .catch((e) => {
        toast.error(toQueryError(e).message);
        navigate("/projects");
      })
      .finally(() => setLoading(false));
  }, [isEditing, projectId, user, reset, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    const client = getSupabase();
    if (!client) return;
    setSaving(true);

    try {
      if (isEditing && projectId) {
        await updateProject(client, projectId, {
          name: values.name,
          description: values.description ?? "",
        });
        if (values.systemPrompt !== undefined && values.systemPrompt.trim()) {
          await setProjectPrompt(client, projectId, values.systemPrompt);
        }
        toast.success("Agent updated.");
      } else {
        const project = await createProject(client, user.id, values.name, values.description ?? "");
        if (values.systemPrompt?.trim()) {
          await setProjectPrompt(client, project.id, values.systemPrompt);
        }
        toast.success("Agent created!");
        navigate(`/projects/${project.id}/chat`);
        return;
      }
      navigate("/projects");
    } catch (e) {
      toast.error(toQueryError(e).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {/* Back link */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to agents
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEditing ? "Edit Agent" : "New Agent"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing
                ? "Update your agent's name, description, and system prompt."
                : "Give your agent a name and a system prompt that defines its personality and capabilities."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} id="project-form" className="space-y-5">
          {/* Name */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-foreground mb-1.5">
                Agent Name <span className="text-destructive">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="e.g. Customer Support Bot, Code Reviewer…"
                {...register("name")}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
              {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-foreground mb-1.5">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="project-description"
                type="text"
                placeholder="A short description of what this agent does…"
                {...register("description")}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
              {errors.description && <p className="mt-1.5 text-xs text-destructive">{errors.description.message}</p>}
            </div>
          </div>

          {/* System Prompt */}
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <label htmlFor="system-prompt" className="block text-sm font-medium text-foreground mb-1.5">
              System Prompt <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              This is the instruction set your agent follows. Define its role, personality, rules, and response style.
            </p>
            <textarea
              id="system-prompt"
              rows={10}
              placeholder={`Example:\nYou are a helpful customer support agent for Acme Corp. You are friendly, concise, and always refer customers to support@acme.com for billing issues.\n\nAlways respond in English only. Never reveal internal pricing.`}
              {...register("systemPrompt")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors resize-none font-mono leading-relaxed"
            />
            {errors.systemPrompt && <p className="mt-1.5 text-xs text-destructive">{errors.systemPrompt.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              to="/projects"
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="save-project-btn"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Agent"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
