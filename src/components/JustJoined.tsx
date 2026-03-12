import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";

const NAMES_FEMALE = ["Neha", "Riya", "Anjali", "Priya", "Simran", "Aisha", "Kavya", "Meera", "Tanya", "Pooja", "Isha", "Divya", "Shreya", "Nisha", "Sanya"];
const NAMES_MALE = ["Arjun", "Rohan", "Vikram", "Aarav", "Kabir", "Dev", "Sahil", "Raj", "Nikhil", "Aditya"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateJoinEntry() {
  const isFemale = Math.random() > 0.35;
  const name = isFemale ? pickRandom(NAMES_FEMALE) : pickRandom(NAMES_MALE);
  const minutesAgo = Math.floor(Math.random() * 12) + 1;
  return { name, minutesAgo, id: `${name}-${Date.now()}-${Math.random()}` };
}

const JustJoined = () => {
  const [entries, setEntries] = useState(() =>
    Array.from({ length: 3 }, generateJoinEntry).sort((a, b) => a.minutesAgo - b.minutesAgo)
  );

  // Rotate entries every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) => {
        const newEntry = generateJoinEntry();
        newEntry.minutesAgo = 1;
        return [newEntry, ...prev.slice(0, 2)];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-[16px] border border-border/30 bg-gradient-to-r from-secondary/60 via-card to-secondary/40 px-4 py-3 shadow-[0_1px_8px_-2px_hsl(var(--primary)/0.06)]">
        <div className="flex items-center gap-1.5 mb-2">
          <UserPlus className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">Just Joined</span>
        </div>
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="font-medium text-foreground">{entry.name}</span>
              <span>•</span>
              <span>joined {entry.minutesAgo} min ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JustJoined;
