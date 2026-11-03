import { Field, Label, Switch as HeadlessSwitch } from '@headlessui/react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  // Helper text under the label.
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

// On/off toggle; prefer it over a checkbox for settings that apply immediately or on save.
export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: SwitchProps) {
  return (
    <Field disabled={disabled} className={cn('flex items-start gap-3', className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        className={cn(
          'group relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border bg-background shadow-inner transition-colors data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50',
          focusRing
        )}
      >
        <span className="inline-block size-3.5 translate-x-0.5 rounded-full bg-gray-400 transition-transform group-data-checked:translate-x-4 group-data-checked:bg-white" />
      </HeadlessSwitch>
      {(label || description) && (
        <div className="min-w-0 -mt-0.5">
          {label && (
            <Label className="text-sm font-medium text-gray-200 cursor-pointer">{label}</Label>
          )}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
    </Field>
  );
}
