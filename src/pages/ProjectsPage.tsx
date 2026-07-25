import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle, Trash2, Edit3, Bot, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { fetchProjects, deleteProject, toQueryError } from "@/lib/userData";
import type { ProjectRow } from "@/lib/database.types";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const client = getSupabase();
    if (!client) return;

    fetchProjects(client, user.id)
      .then(setProjects)
      .catch((e) => setError(toQueryError(e).message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (project: ProjectRow) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    const client = getSupabase();
    if (!client) return;
    setDeletingId(project.id);
    try {
      await deleteProject(client, project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success("Project deleted.");
    } catch (e) {
      toast.error(toQueryError(e).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build and manage your custom AI agents</p>
        </div>
        <Link
          to="/projects/new"
          id="create-project-btn"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </Link>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Could not load projects</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <motion.div
          initial="hidden" animate="visible" variants={fadeIn} custom={1}
          className="rounded-2xl border-2 border-dashed border-border/60 bg-card/50 p-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">No agents yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Create your first AI agent by giving it a name and a system prompt that defines its behavior.
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create your first agent
          </Link>
        </motion.div>
      )}

      {/* Projects grid */}
      <AnimatePresence>
        <div className="grid gap-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.97 }}
              variants={fadeIn}
              custom={i + 1}
              className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground truncate">{project.name}</h2>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-mono mt-2">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    id={`edit-project-${project.id}`}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                    title="Edit agent"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project)}
                    disabled={deletingId === project.id}
                    id={`delete-project-${project.id}`}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                    title="Delete agent"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <Link
                    to={`/projects/${project.id}/chat`}
                    id={`open-chat-${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/15 transition-colors ml-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
