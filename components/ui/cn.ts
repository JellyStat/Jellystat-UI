import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes; later classes win, so a call site's className can override kit defaults.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
