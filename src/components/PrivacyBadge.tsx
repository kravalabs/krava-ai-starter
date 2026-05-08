import { useState } from "react";
import { Lock } from "lucide-react";

export function PrivacyBadge() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open && (
        <div className="mb-2 max-w-xs rounded-2xl bg-card p-4 text-sm text-card-foreground shadow-soft border border-border">
          <p className="leading-relaxed">
            Your messages are encrypted before they leave your device. Even our
            servers cannot read your conversations. Use the 🔥 button anytime to
            permanently delete everything.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur shadow-soft border border-border hover:text-foreground transition"
        aria-label="Privacy info"
      >
        <Lock className="h-3.5 w-3.5" />
        Zero-knowledge encrypted
      </button>
    </div>
  );
}
