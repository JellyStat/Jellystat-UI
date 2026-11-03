// Unstyled headlessui building blocks, for the rare component that needs more control than the
// kit's styled Select / MultiSelect / Popover / Modal (e.g. a searchable Combobox, grouped options).
// Import them from here, not from @headlessui/react, so the kit stays the only place that depends on it.
// Style them with the theme tokens and the helpers in "@/components/ui" (inputClass, focusRing, cn).
export {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Popover as HeadlessPopover,
  PopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
} from '@headlessui/react';
