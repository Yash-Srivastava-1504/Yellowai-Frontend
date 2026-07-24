import { getStoredCompanion, type CompanionType } from "@/lib/companion";
import { useAuth } from "@/contexts/AuthContext";

const valid: CompanionType[] = ["didi", "bhaiya", "friend"];

export function useCompanionType(): CompanionType {
  const { profile } = useAuth();
  const c = profile?.companion;
  if (c && valid.includes(c as CompanionType)) return c as CompanionType;
  return getStoredCompanion();
}
