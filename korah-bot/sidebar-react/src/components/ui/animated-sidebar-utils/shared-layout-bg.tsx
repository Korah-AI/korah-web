"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { SPRING_LAYOUT } from "./ease";

export interface SharedLayoutBgProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: "ul" | "div" | "nav";
  /** Horizontal inset of the pill from the list edges, in px. */
  inset?: number;
  pillClassName?: string;
  pillContainerClassName?: string;
  children?: ReactNode;
}

/**
 * A list whose hover/focus highlight is one pill that slides between direct
 * children, instead of each child painting its own background.
 */
export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      as: Tag = "div",
      inset = 0,
      pillClassName,
      pillContainerClassName,
      className,
      children,
      onPointerMove,
      onPointerLeave,
      onFocus,
      onBlur,
      ...props
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLElement | null>(null);
    const reduce = useReducedMotion() ?? false;
    const [y, setY] = useState<number | null>(null);
    const lastY = useRef(0);
    const wasVisible = useRef(false);

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        rootRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const track = (target: EventTarget | null) => {
      const root = rootRef.current;
      if (!root || !(target instanceof Element)) return;
      let child: Element | null = target;
      while (child && child.parentElement !== root) child = child.parentElement;
      if (!(child instanceof HTMLElement) || child.dataset.pill === "false") return;
      setY(child.offsetTop);
    };

    useEffect(() => {
      wasVisible.current = y !== null;
      if (y !== null) lastY.current = y;
    }, [y]);

    return (
      <Tag
        {...(props as HTMLAttributes<HTMLElement>)}
        ref={setRefs as never}
        className={cn("relative", className)}
        onPointerMove={(event: React.PointerEvent<HTMLElement>) => {
          onPointerMove?.(event);
          if (event.pointerType !== "touch") track(event.target);
        }}
        onPointerLeave={(event: React.PointerEvent<HTMLElement>) => {
          onPointerLeave?.(event);
          setY(null);
        }}
        onFocus={(event: React.FocusEvent<HTMLElement>) => {
          onFocus?.(event);
          track(event.target);
        }}
        onBlur={(event: React.FocusEvent<HTMLElement>) => {
          onBlur?.(event);
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setY(null);
        }}
      >
        <li
          aria-hidden="true"
          data-pill="false"
          className={cn("pointer-events-none absolute z-0", pillContainerClassName)}
          style={{ left: inset, right: inset }}
        >
          <motion.div
            initial={false}
            animate={{ y: y ?? lastY.current, opacity: y === null ? 0 : 1 }}
            transition={{
              y: reduce || !wasVisible.current ? { duration: 0 } : SPRING_LAYOUT,
              opacity: { duration: 0.12 },
            }}
            className={cn("h-full w-full", pillClassName)}
          />
        </li>
        {children}
      </Tag>
    );
  },
);
