import NewNote from "./new-note";

type NavProps = {
  addNewPinnedNote: (slug: string, isCurrentlyPinned: boolean) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
};

export function Nav({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
  isScrolled,
}: NavProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 ${
        isScrolled ? "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]" : ""
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
        setSelectedNoteSlug={setSelectedNoteSlug}
      />
    </div>
  );
}
