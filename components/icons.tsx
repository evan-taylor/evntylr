import { ChevronLeft, Moon, PenSquare, Search, Sun, X } from "lucide-react";

type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  new: (props: IconProps) => (
    <PenSquare className="text-current" size={16} {...props} />
  ),
  search: (props: IconProps) => (
    <Search className="text-muted-foreground" size={14} {...props} />
  ),
  close: (props: IconProps) => (
    <X className="text-muted-foreground" size={14} {...props} />
  ),
  sun: (props: IconProps) => (
    <Sun className="text-muted-foreground" size={16} {...props} />
  ),
  moon: (props: IconProps) => (
    <Moon className="text-muted-foreground" size={16} {...props} />
  ),
  back: (props: IconProps) => (
    <ChevronLeft className="text-foreground/90" size={20} {...props} />
  ),
  spinner: (props: IconProps) => (
    <svg
      aria-label="Loading"
      className="spinner"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Loading</title>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};
