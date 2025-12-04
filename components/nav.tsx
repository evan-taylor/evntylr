import NewNote from "./new-note";

type NavProps = {
  addNewPinnedNote: (slug: string, isCurrentlyPinned: boolean) => void;
  clearSearch: () => void;
  isMobile: boolean;
  isScrolled: boolean;
};

export function Nav({
  addNewPinnedNote,
  clearSearch,
  isMobile,
  isScrolled,
}: NavProps) {
  return (
    <div
      className={`liquid-transition flex items-center justify-between px-4 py-2 ${
        isScrolled ? "border-border/30 border-b shadow-sm" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 p-2">
        <button
          aria-label="Close tab"
          className="group flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-red-500 hover:opacity-80"
          onClick={() => window.close()}
          type="button"
        >
          <span className="-translate-y-[0.5px] font-medium text-[10px] text-background leading-none opacity-0 group-hover:opacity-100">
            ×
          </span>
        </button>
        <button
          aria-label="Minimize (disabled)"
          className="group flex h-3 w-3 cursor-default items-center justify-center rounded-full bg-yellow-500 hover:opacity-80"
          type="button"
        >
          <span className="-translate-y-[0.5px] font-medium text-[10px] text-background leading-none opacity-0 group-hover:opacity-100">
            −
          </span>
        </button>
        <button
          aria-label="Maximize (disabled)"
          className="group flex h-3 w-3 cursor-default items-center justify-center rounded-full bg-green-500 hover:opacity-80"
          type="button"
        >
          <span className="-translate-y-[0.5px] font-medium text-[10px] text-background leading-none opacity-0 group-hover:opacity-100">
            +
          </span>
        </button>
      </div>
      <NewNote
        addNewPinnedNote={addNewPinnedNote}
        clearSearch={clearSearch}
        isMobile={isMobile}
      />
    </div>
  );
}
