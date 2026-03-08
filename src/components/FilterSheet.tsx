import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const tags = ["All", "Cheerful & Witty", "Confident & Bold", "College Buddy", "Creative Soul", "Bookworm", "Boss Vibes", "Fitness Freak", "Free Spirit"];

interface FilterSheetProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterSheet = ({ activeFilter, onFilterChange }: FilterSheetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-2xl bg-card p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Filter Companions</h3>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onFilterChange(tag);
                    setOpen(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeFilter === tag
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSheet;
