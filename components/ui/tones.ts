// Shared semantic tones for tinted components (Badge, IconChip, alerts).
// Full class strings so Tailwind can see them at build time.
export const tintClass = {
  primary: 'bg-primary/10 border-primary/20 text-primary-soft',
  accent: 'bg-accent/10 border-accent/20 text-accent',
  success: 'bg-success/10 border-success/20 text-success',
  danger: 'bg-danger/10 border-danger/20 text-danger',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  info: 'bg-info/10 border-info/20 text-info',
  neutral: 'bg-surface-raised border-border text-gray-400',
} as const;

export type Tone = keyof typeof tintClass;

// Keyboard focus ring used by every interactive kit component.
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary';
