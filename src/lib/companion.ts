export type CompanionType = "didi" | "bhaiya" | "friend";
export type GenderType = "male" | "female" | "other";

export interface CompanionInfo {
  type: CompanionType;
  emoji: string;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  greeting: string;
}

export const companions: Record<CompanionType, CompanionInfo> = {
  didi: {
    type: "didi",
    emoji: "👧",
    name: "Didi",
    subtitle: "Big Sister",
    description: "Warm, empathetic, understanding",
    status: "Always here for you 💙",
    greeting: "Hi! 👋 Main yahan hoon tumhare liye. How are you feeling today? Tell me everything, no judgment.",
  },
  bhaiya: {
    type: "bhaiya",
    emoji: "👦",
    name: "Bhaiya",
    subtitle: "Big Brother",
    description: "Supportive, grounded, reassuring",
    status: "Got your back 💪",
    greeting: "Hey! 👋 Kya haal hai? I'm here to listen and help. What's going on?",
  },
  friend: {
    type: "friend",
    emoji: "👤",
    name: "Friend",
    subtitle: "Gender-Neutral Buddy",
    description: "Casual, relatable, chill",
    status: "Online and listening ✨",
    greeting: "Hey bestie! 👋 How are you really doing? I'm all ears, no cap.",
  },
};

export function getSuggestedCompanions(gender: GenderType): CompanionType[] {
  switch (gender) {
    case "male":
      return ["didi", "bhaiya", "friend"];
    case "female":
      return ["bhaiya", "didi", "friend"];
    case "other":
      return ["friend", "didi", "bhaiya"];
  }
}

export function getStoredCompanion(): CompanionType {
  return (localStorage.getItem("manah_companion") as CompanionType) || "friend";
}

export function setStoredCompanion(companion: CompanionType) {
  localStorage.setItem("manah_companion", companion);
}

export function getStoredGender(): GenderType | null {
  return localStorage.getItem("manah_gender") as GenderType | null;
}

export function setStoredGender(gender: GenderType) {
  localStorage.setItem("manah_gender", gender);
}

export function getAIResponseForCompanion(input: string, companion: CompanionType): string {
  const lower = input.toLowerCase();
  const responses: Record<CompanionType, Record<string, string>> = {
    didi: {
      exam: "Arre, I totally get it — exam pressure can feel like the world is on your shoulders 💙 Main samajh sakti hoon. Let's talk through it. Would you like a quick breathing exercise, or do you just want to vent? I'm here either way.",
      lonely: "Main yahan hoon, don't worry. Feeling lonely is so valid, especially when everyone around seems busy with their own lives. Tell me more — what's making you feel this way?",
      exercise: "Great idea! Let me guide you through 4-7-8 breathing:\n\n1. Breathe in through your nose for 4 seconds\n2. Hold for 7 seconds\n3. Exhale slowly for 8 seconds\n\nRepeat 3-4 times. I'll be right here 🤗",
      sad: "Hey, it's okay to feel this way. Tension mat le — tough days happen and they pass. What's been weighing on you the most? Sometimes just naming it helps. I'm listening 🌿",
      default: "Thank you for sharing that with me 💙 I'm here to listen, always. Tell me more about what's going on — we'll figure it out together, step by step.",
    },
    bhaiya: {
      exam: "Bhai, sunn — exam stress is real, I've been there. But one exam doesn't define you. Let's break this down: what's the hardest part right now? We'll tackle it together 💪",
      lonely: "Yaar, feeling alone sucks, I know. But real talk — reaching out takes guts. I'm here, and you're not alone in this. Want to talk about what's going on?",
      exercise: "Good call! Try this 4-7-8 breathing technique:\n\n1. Breathe in for 4 seconds\n2. Hold for 7 seconds\n3. Exhale slowly for 8 seconds\n\nDo it 3-4 times. Trust me, it works. I do it before interviews too 😄",
      sad: "Bhai, it's okay to not be okay. Between us — everyone struggles, but nobody talks about it. What's on your mind? Let's sort it out.",
      default: "Got it, bhai. I'm here to listen and help however I can. Tell me more — what's the toughest part right now?",
    },
    friend: {
      exam: "Oof, exam stress hits different 😭 Ngl, I've been there and it sucks. But you're not gonna let one test define you, right? Want to try a quick breathing exercise or just vent? I'm here either way ✨",
      lonely: "That feeling is so valid and way more common than people admit 💗 You reaching out is actually huge. Tell me what's going on — I'm all ears, no judgment.",
      exercise: "Yes bestie! Try 4-7-8 breathing:\n\n1. Breathe in for 4 seconds\n2. Hold for 7 seconds\n3. Exhale slowly for 8 seconds\n\nRepeat 3-4 times. It actually slaps for calming down, fr fr 🧘",
      sad: "Hey, tough days are tough days — no need to pretend otherwise. What's bringing you down? Sometimes just talking about it helps more than you'd think 🌿",
      default: "Thanks for sharing that with me ✨ I'm here, no judgment, no pressure. Tell me more about what's going on and we'll figure it out together.",
    },
  };

  const personaResponses = responses[companion];
  if (lower.includes("exam") || lower.includes("stress")) return personaResponses.exam;
  if (lower.includes("lonely") || lower.includes("alone")) return personaResponses.lonely;
  if (lower.includes("exercise") || lower.includes("breathing")) return personaResponses.exercise;
  if (lower.includes("low") || lower.includes("sad") || lower.includes("depressed")) return personaResponses.sad;
  return personaResponses.default;
}
