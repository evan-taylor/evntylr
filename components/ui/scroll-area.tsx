"use client";

import {
  Corner,
  Root,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  Viewport,
} from "@radix-ui/react-scroll-area";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Custom ScrollArea component for the chat interface
 * Customized with:
 * - 64px padding on top and bottom of the scrollbar so its not hidden bethind chat header and message input
 * - Custom scrollbar styling to match the scrollbar design in globals.css
 * - 14px total width with 4px transparent border for a clean look
 */
const ScrollArea = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root> & {
    withVerticalMargins?: boolean;
    mobileHeaderHeight?: boolean;
    isMobile?: boolean;
  }
>(
  (
    {
      className,
      children,
      withVerticalMargins = false,
      mobileHeaderHeight = false,
      isMobile = false,
      ...props
    },
    ref
  ) => (
    <Root
      className={cn("relative overflow-hidden", className)}
      ref={ref}
      {...props}
    >
      <Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </Viewport>
      <ScrollBar
        isMobile={isMobile}
        mobileHeaderHeight={mobileHeaderHeight}
        withVerticalMargins={withVerticalMargins}
      />
      <Corner />
    </Root>
  )
);
ScrollArea.displayName = Root.displayName;

function getVerticalMarginClass(
  withVerticalMargins: boolean,
  mobileHeaderHeight: boolean
): string {
  if (withVerticalMargins && mobileHeaderHeight) {
    return "mt-24 mb-16";
  }
  if (withVerticalMargins) {
    return "my-16";
  }
  return "";
}

// Add vertical margins to for chat area component
const ScrollBar = forwardRef<
  ElementRef<typeof ScrollAreaScrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaScrollbar> & {
    withVerticalMargins?: boolean;
    mobileHeaderHeight?: boolean;
    isMobile?: boolean;
  }
>(
  (
    {
      className,
      orientation = "vertical",
      withVerticalMargins = false,
      mobileHeaderHeight = false,
      isMobile = false,
      ...props
    },
    ref
  ) => (
    <ScrollAreaScrollbar
      className={cn(
        "flex touch-none select-none transition-all duration-300",
        "opacity-80 hover:opacity-100",
        "bg-transparent hover:border-gray-200 hover:border-l dark:hover:border-gray-700",
        orientation === "vertical" &&
          cn(
            isMobile === true ? "w-[8px]" : "w-[10px] hover:w-[14px]",
            getVerticalMarginClass(withVerticalMargins, mobileHeaderHeight)
          ),
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      orientation={orientation}
      ref={ref}
      {...props}
    >
      <ScrollAreaThumb
        className={cn(
          "relative flex-1 rounded-full transition-colors duration-200",
          "border-2 border-transparent border-solid bg-clip-padding",
          "bg-gray-500 dark:bg-gray-400"
        )}
      />
    </ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
