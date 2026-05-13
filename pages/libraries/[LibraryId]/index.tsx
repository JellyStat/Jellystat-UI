import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Title, Loader, Text, Group, Tabs, Center } from "@mantine/core";
import client from "@/lib/api";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder } from "gridify-client";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import { IconPhoto } from "@tabler/icons-react";
import LibraryOverView from "./overview";
import LibraryMedia from "./media";
import LibraryActivity from "./activity";
import NotFound from "@/components/ErrorCards/NotFound";

export default function LibraryPage() {
  const router = useRouter();
  const { LibraryId } = router.query;

  const [lib, setLib] = useState<LibrariesWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("overview");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!LibraryId || Array.isArray(LibraryId)) return;
      setLoading(true);
      setError(null);
      try {
        // Load libraries and find the matching one
        const libsRes = await client.Api.getLibraries(new GridifyQueryBuilder().addOrderBy("name").build());
        const found = libsRes?.data?.find((l) => l.id === LibraryId) ?? null;
        if (!mounted) return;
        setLib(found);
        // Load items for this library (scaffold - may include parent data)
        // const q = new GridifyQueryBuilder().addOrderBy("name").build();
      } catch (er: any) {
        console.error(er);
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
  }, [LibraryId]);

  if (!lib && !loading && !error) {
    console.error("No LibraryId provided in query");
    return <NotFound title="Library not found" message={`Library with id ${LibraryId} could not be found`} />;
  }

  return (
    <div style={{ padding: 20 }}>
      {loading && (
        <Center>
          <Loader />
        </Center>
      )}

      {error && <Text color="red">Error loading library: {error}</Text>}

      {!loading && !error && (
        <>
          <Group style={{ marginBottom: 12 }}>
            <Group align="center">
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(() => {
                  const Icon = LibraryTypeIcons[lib?.type ?? ""] ?? IconPhoto;
                  return <Icon size={64} color="#bbbbbb" />;
                })()}
              </div>

              <Group gap={4} style={{ flexDirection: "column", alignItems: "start" }}>
                <Group>
                  <Title order={2}>{lib?.name ?? LibraryId}</Title>
                </Group>
                <Tabs value={activeTab} onChange={setActiveTab}>
                  <Tabs.List>
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                    <Tabs.Tab value="media">Media</Tabs.Tab>
                    <Tabs.Tab value="activity">Activity</Tabs.Tab>
                    <Tabs.Tab value="options">Options</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              </Group>
            </Group>

            <div></div>
          </Group>
          <Tabs value={activeTab} keepMountedMode="display-none">
            <Tabs.Panel value="overview">
              <LibraryOverView library={lib} />
            </Tabs.Panel>

            <Tabs.Panel value="media">
              <LibraryMedia library={lib} />
            </Tabs.Panel>

            <Tabs.Panel value="activity">
              <LibraryActivity library={lib} />
            </Tabs.Panel>

            <Tabs.Panel value="options">
              <div style={{ marginTop: 16 }}>
                <Title order={3}>Options</Title>
                <Text color="dimmed">Library options and settings go here.</Text>
              </div>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </div>
  );
}
