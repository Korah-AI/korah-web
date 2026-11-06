type Bezier = [number, number, number, number];

export const EASE_OUT: Bezier = [0.23, 1, 0.32, 1];
export const EASE_DRAWER: Bezier = [0.32, 0.72, 0, 1];

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.8,
} as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 600,
  damping: 35,
} as const;
