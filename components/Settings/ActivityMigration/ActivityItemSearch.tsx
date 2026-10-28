import ItemCard from "@/components/ItemsCards/ItemCard";
import { Api } from "@/lib/api";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { Items } from "@/lib/models/items";
import ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { AlertCircle, Film, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onSelect: (item: any) => void;
  name: string;
  id: string | null;
}
export default function ActivityItemSearch({ onSelect, name, id = null }: Props) {
  const [searchResults, setSearchResults] = useState<ItemsWithParentData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation("common");

  const getItems = async () => {
    try {
      setLoading(true);
      const query = new GridifyQueryBuilder();

      if (selectedId) {
        query.addCondition("ParentId", op.Equal, selectedId);
      } else {
        query.addCondition("Name", op.Contains, name);
      }

      query.and().addCondition("Archived", op.Equal, false);
      query.addOrderBy("Index", false);
      const results = await Api.getLibraryItems(query.build());
      setSearchResults(results.data || []);
    } catch (error) {
      console.error("Error searching items:", error);
      setError(t("settings.migration_search_error", "Error searching items. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ActivityItemSearch: name or selectedId changed", { name, selectedId });
    getItems();
  }, [selectedId]);

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Grid Container */}
      <div className="bg-surface/30  flex flex-col relative overflow-auto">
        {/* Error Overlay */}
        {error && (
          <div className="p-4 mb-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-sm text-brand-rose/90 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="max-h-[80vh] overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-4 text-sm font-medium text-gray-400">Series Name</th>
                <th className="p-4 text-sm font-medium text-gray-400">Season</th>
                <th className="p-4 text-sm font-medium text-gray-400">Episode</th>
                <th className="p-4 text-sm font-medium text-gray-400">Name</th>
                <th className="p-4 text-sm font-medium text-gray-400">Type</th>
                <th className="p-4 text-sm font-medium text-gray-400">Library</th>
                <th className="p-4 text-sm font-medium text-gray-400">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">Loading items...</span>
                  </td>
                </tr>
              ) : searchResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm font-medium">
                    <div className="flex flex-col items-center justify-center text-gray-500 opacity-60 ">
                      <Search size={48} className="mb-4" />
                      <span className="text-lg font-bold">{t("media_grid.no_results", "No results found")}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                searchResults.map((it: ItemsWithParentData) => (
                  <tr
                    key={`${it.serverId || ""}-${it.id}`}
                    className={`border-b border-border transition-colors hover:bg-surface-hover bg-transparent cursor-pointer`}
                    onClick={() => {
                      console.log("Selected item:", it);
                      if (it.type === ItemTypes.Series || it.type === ItemTypes.Season) {
                        setSelectedId(it.id);
                      } else {
                        onSelect(it);
                      }
                    }}
                  >
                    <td className="p-4">{it.parent ? it.parent.name : "N/A"}</td>
                    <td className="p-4">{it.parentIndex != null ? `S${it.parentIndex.toString().padStart(2, "0")}` : "N/A"}</td>
                    <td className="p-4">
                      {it.type === ItemTypes.Episode && it.index != null ? `E${it.index.toString().padStart(2, "0")}` : "N/A"}
                    </td>

                    <td className="p-4">{it.name}</td>
                    <td className="p-4">{it.type}</td>
                    <td className="p-4">{it.library?.name ?? "N/A"}</td>

                    <td className="p-4">{it.dateCreated ? new Date(it.dateCreated).toLocaleDateString() : "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
