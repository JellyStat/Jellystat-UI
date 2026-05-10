import React, { useEffect, useState } from "react";
import { Container, SimpleGrid, Title, Loader, Text, Center } from "@mantine/core";
import client from "@/lib/api";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import LibraryCard from "@/components/LibraryCard/LibraryCard";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

export default function LibrariesPage() {
  const [libs, setLibs] = useState<LibrariesWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const query = new GridifyQueryBuilder().addOrderBy("name").build();
        const res = await client.Api.getLibraries(query);
        if (!mounted) return;
        console.log("Loaded libraries:", res?.data);
        setLibs(res?.data ?? []);
      } catch (er: any) {
        console.error("Failed to load libraries", er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Title order={1} mb="md">
        Libraries
      </Title>

      {loading && (
        <Center>
          <Loader />
        </Center>
      )}

      {error && <Text color="red">Error loading libraries: {error}</Text>}

      {!loading && !error && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {libs.map((l) => (
            <LibraryCard key={`${l.serverId}-${l.id}`} lib={l} />
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}
