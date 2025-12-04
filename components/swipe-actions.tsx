import { Edit, Pin, PinOff, Trash2 } from "lucide-react";

type SwipeActionsProps = {
  isOpen: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPinned: boolean;
  canEditOrDelete: boolean;
};

export function SwipeActions({
  isOpen,
  onPin,
  onEdit,
  onDelete,
  isPinned,
  canEditOrDelete,
}: SwipeActionsProps) {
  return (
    <div
      className={`absolute top-0 right-0 flex h-full items-center transition-opacity duration-300 ${
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <button
        className="flex h-full w-16 items-center justify-center bg-[#3293FC] p-2 text-white"
        onClick={onPin}
        type="button"
      >
        {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
      </button>
      {canEditOrDelete === true && (
        <>
          <button
            className="flex h-full w-16 items-center justify-center bg-[#787BFF] p-2 text-white"
            onClick={onEdit}
            type="button"
          >
            <Edit size={20} />
          </button>
          <button
            className="flex h-full w-16 items-center justify-center bg-[#FF4539] p-2 text-white"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={20} />
          </button>
        </>
      )}
    </div>
  );
}
