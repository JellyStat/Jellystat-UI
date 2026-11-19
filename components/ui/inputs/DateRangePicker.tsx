import 'react-day-picker/dist/style.css';
import { useState, type Ref } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { ca, de, enGB, enUS, es, fr, it, pl, zhCN } from 'react-day-picker/locale';
import { useTranslation } from 'react-i18next';

// Calendar month/day names and first day of the week, per app locale (e.g. en-GB and de-DE weeks start on Monday).
// Add an entry here when adding a language; unknown codes fall back to enUS.
const CALENDAR_LOCALES = {
  'en-US': enUS,
  'en-GB': enGB,
  'de-DE': de,
  'fr-FR': fr,
  'es-ES': es,
  'it-IT': it,
  'ca-ES': ca,
  'pl-PL': pl,
  'zh-CN': zhCN,
} as const;

export type DateRangePickerProps = {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  ref?: Ref<HTMLDivElement>;
};

// Range calendar in an overlay panel; usually placed inside a headlessui PopoverPanel.
// Accent colours come from the .rdp-root overrides in styles/globals.css.
export default function DateRangePicker({ value, onChange, ref }: DateRangePickerProps) {
  const { i18n } = useTranslation();
  const [range, setRange] = useState<DateRange | undefined>(value);

  function handleSelect(newRange: DateRange | undefined) {
    setRange(newRange);
    onChange(newRange);
  }

  return (
    <div
      ref={ref}
      className="p-4 border border-border rounded-2xl max-w-sm bg-surface shadow-2xl shadow-black/40"
    >
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        locale={CALENDAR_LOCALES[i18n.language as keyof typeof CALENDAR_LOCALES] ?? enUS}
        className="text-sm"
        animate
      />
    </div>
  );
}
