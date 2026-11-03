import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Select } from "@/components/ui";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/locales";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation("common");
  const currentLang = i18n.language;

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-gray-400" />
      <Select
        data={LANGUAGES.map((lang) => ({ value: lang.code }))}
        value={currentLang}
        onChange={(val) => {
          if (!val) return;
          localStorage.setItem(LOCALE_STORAGE_KEY, val);
          void i18n.changeLanguage(val);
        }}
        labelFn={(val) => {
          const lang = LANGUAGES.find((l) => l.code === val);
          return lang ? lang.name : "";
        }}
      />
    </div>
  );
}
