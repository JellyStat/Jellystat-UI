import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, Text, TextInput, Loader, Select, Button, Title, Group } from "@mantine/core";
import client from "@/lib/api";
import type { IGridifyQuery } from "gridify-client";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ActivityItemCard from "../ActivityItemsCards/ActivityItemCard";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import ItemCard from "../ItemsCards/ItemCard";

type Props = {
  gridify?: GridifyQueryBuilder;
};

const MediaGrid: React.FC<Props> = ({ gridify }) => {
  const [items, setItems] = useState<ItemsWithStats[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState("");
  const [input, setInput] = useState("");
  const [sortField, setSortField] = useState<string>("dateCreated");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [archivedFilter, setArchivedFilter] = useState<boolean | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const query: GridifyQueryBuilder = gridify ? new GridifyQueryBuilder({ from: gridify }) : new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        if (filter && filter.trim() !== "") {
          query.and().addCondition("Name", op.Contains, filter.trim(), false);
        }
        if (sortField) query.addOrderBy(sortField, sortDesc);
        if (archivedFilter !== null) {
          query.and().addCondition("Archived", op.Equal, archivedFilter.toString());
        }
        const builtQuery = query.build();
        console.log("Fetching media with query:", builtQuery);

        const res = await client.Api.getLibraryItems(builtQuery);
        const data = res?.data ?? [];

        setItems((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === builtQuery.pageSize);
        setPage(pageToLoad);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [filter, gridify, sortDesc, sortField, archivedFilter],
  );

  // initial load & when filter or sort changes
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortField, sortDesc, archivedFilter]);

  // debounce input -> set filter
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter(input.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  // infinite scroll using intersection observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !loading && hasMore) {
            fetchPage(page + 1);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, hasMore, loading, page]);

  return (
    <div>
      <Group align="center" justify="space-between">
        <Title order={2}>Media</Title>
        <Group align="center" gap={8}>
          <Select
            data={[
              { value: "null", label: "All" },
              { value: "true", label: "Archived" },
              { value: "false", label: "Not Archived" },
            ]}
            value={archivedFilter === null ? "null" : archivedFilter ? "true" : "false"}
            onChange={(v) => setArchivedFilter(v === "true" ? true : v === "false" ? false : null)}
            style={{ width: 160 }}
          />
          <Select
            data={[
              { value: "name", label: "Title" },
              { value: "dateCreated", label: "Date Added" },
              { value: "playCount", label: "Views" },
              { value: "size", label: "Size" },
            ]}
            value={sortField}
            onChange={(v) => setSortField(v ?? "name")}
            style={{ width: 160 }}
          />
          <Button size="xs" variant="outline" onClick={() => setSortDesc((s) => !s)} style={{ padding: "6px 8px" }}>
            {sortDesc ? "↓" : "↑"}
          </Button>
          <TextInput
            placeholder="Search media..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            style={{ maxWidth: 320, flex: "0 0 auto" }}
          />
        </Group>
      </Group>
      <Card shadow="sm" p="md" style={{ width: "100%", marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {items.map((it: ItemsWithStats) => (
            <div key={`${it.serverId || ""}-${it.id}`} style={{ width: "100%" }}>
              <ItemCard item={it} width="100%" />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          {loading && <Loader size="sm" />}
          {!loading && !hasMore && items.length > 0 && <Text color="dimmed">End of results</Text>}
          {!loading && items.length === 0 && <Text color="dimmed">No results</Text>}
        </div>

        <div ref={sentinelRef} />
        {error && (
          <Text color="red" size="sm" style={{ marginTop: 8 }}>
            {error}
          </Text>
        )}
      </Card>
    </div>
  );
};

export default MediaGrid;
