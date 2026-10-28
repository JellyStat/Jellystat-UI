import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";

import client from "@/lib/api";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import type { TimelineEntry } from "@/lib/models/timelineEntry";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import NoData from "../ErrorCards/NoData";
import ActivityTimelineItem from "./ActivityTimelineItem";
import { TIMELINE_PAGE_SIZE, parseStoredIds } from "./helpers";

const LIBRARY_PREF_KEY = "PREF_ACTIVITY_TIMELINE_selectedLibraries";

type Props = {
  userId: string;
};

function readStoredLibraries(): string[] | null {
  try {
    return parseStoredIds(localStorage.getItem(LIBRARY_PREF_KEY));
  } catch {
    return null;
  }
}

function storeLibraries(ids: string[]) {
  try {
    localStorage.setItem(LIBRARY_PREF_KEY, JSON.stringify(ids));
  } catch {
    /* ignore localStorage errors */
  }
}

export default function ActivityTimeline({ userId }: Props) {
  const { t } = useTranslation("common");

  const [libraries, setLibraries] = useState<LibrariesWithStats[]>([]);
  // null = nothing chosen yet, which means "all libraries"
  const [selected, setSelected] = useState<string[] | null>(null);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(TIMELINE_PAGE_SIZE);

  // Libraries (the API already excludes excluded libraries)
  useEffect(() => {
    let mounted = true;
    client.Api.getLibraries()
      .then((res) => {
        if (!mounted) return;
        const libs = res?.data ?? [];
        setLibraries(libs);
        const stored = readStoredLibraries();
        // keep only stored ids that still exist; fall back to all libraries
        const valid = stored?.filter((id) => libs.some((l) => l.id === id));
        setSelected(valid && valid.length > 0 ? valid : libs.map((l) => l.id));
      })
      .catch((er) => {
        console.error(er);
        if (mounted) setError(er?.message ?? String(er));
      })
      .finally(() => mounted && setLibrariesLoaded(true));
    return () => {
      mounted = false;
    };
  }, []);

  // Timeline
  useEffect(() => {
    if (!librariesLoaded || selected == null) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    client.History.timeline({ UserId: userId, LibraryIds: selected })
      .then((res) => {
        if (!mounted) return;
        setEntries(res ?? []);
        setVisible(TIMELINE_PAGE_SIZE);
      })
      .catch((er) => {
        console.error(er);
        if (mounted) setError(er?.message ?? String(er));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [userId, selected, librariesLoaded]);

  const toggleLibrary = (id: string) => {
    const current = selected ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // never allow an empty selection: the API treats that as "all libraries"
    if (next.length === 0) return;
    setSelected(next);
    storeLibraries(next);
  };

  const shown = useMemo(() => entries.slice(0, visible), [entries, visible]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Library filter */}
      {libraries.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {libraries.map((lib) => {
            const active = selected?.includes(lib.id) ?? false;
            return (
              <button
                key={lib.id}
                type="button"
                onClick={() => toggleLibrary(lib.id)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border shrink-0 cursor-pointer transition-all duration-300 text-xs font-bold ${
                  active
                    ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20"
                    : "bg-surface text-gray-400 border-border hover:text-white hover:border-gray-500"
                }`}
              >
                {(() => {
                  const Icon = LibraryTypeIcons[lib.type] ?? LibraryTypeIcons["Unknown"];
                  return Icon ? <Icon size={12} /> : null;
                })()}
                {lib.name}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={40} className="text-brand-cyan animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="p-6 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex flex-col items-center text-center max-w-lg mx-auto">
          <AlertCircle size={40} className="text-brand-rose mb-3" />
          <span className="text-xl font-bold text-white mb-2">{t("timeline.error_loading", "Error loading timeline")}</span>
          <span className="text-sm text-gray-400">{error}</span>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <NoData
          title={t("timeline.empty_title", "Nothing on the timeline yet")}
          message={t("timeline.empty_message", "No qualifying playback found for the selected libraries")}
        />
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <ol className="relative w-full max-w-5xl mx-auto">
            {shown.map((entry, index) => (
              <ActivityTimelineItem
                key={`${entry.itemId}-${entry.firstActivityDate}-${entry.lastActivityDate}`}
                entry={entry}
                side={index % 2 === 0 ? "left" : "right"}
              />
            ))}
          </ol>
          {visible < entries.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + TIMELINE_PAGE_SIZE)}
              className="self-center px-5 py-2 rounded-xl text-sm font-bold border border-border text-gray-300 hover:text-white hover:bg-surface-hover transition-colors"
            >
              {t("timeline.show_more", "Show more")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
