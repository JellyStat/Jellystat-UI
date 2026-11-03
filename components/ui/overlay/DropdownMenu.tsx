import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { buttonClass } from '../primitives/Button';

export type DropdownMenuItem = {
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export type DropdownMenuProps = {
  // Trigger text; a chevron is appended.
  label: ReactNode;
  items: DropdownMenuItem[];
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
  className?: string;
};

// Action menu: a secondary button that opens a list of commands.
export default function DropdownMenu({
  label,
  items,
  size = 'sm',
  align = 'end',
  className,
}: DropdownMenuProps) {
  return (
    <Menu>
      <MenuButton className={buttonClass({ variant: 'secondary', size }, className)}>
        {label} <ChevronDown size={size === 'sm' ? 14 : 16} />
      </MenuButton>
      <MenuItems
        anchor={{ to: `bottom ${align}`, gap: 4 }}
        transition
        className="z-50 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-2xl shadow-black/40 focus:outline-none transition duration-100 ease-out data-closed:opacity-0"
      >
        {items.map((item, idx) => (
          <MenuItem key={idx} disabled={item.disabled}>
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer data-focus:bg-surface-hover data-disabled:opacity-50 data-disabled:cursor-not-allowed',
                item.danger ? 'text-danger' : 'text-gray-200 data-focus:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
