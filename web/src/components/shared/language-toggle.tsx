import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, type LangCode } from "@/i18n";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: LangCode) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold tracking-wide">{currentLang.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={
              currentLang.code === lang.code
                ? "bg-primary/10 text-primary font-semibold"
                : ""
            }
          >
            <span className="mr-2 font-medium">{lang.label}</span>
            <span className="text-xs text-muted-foreground">{lang.fullLabel}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
