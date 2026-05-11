import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Title, Loader, Text, Group, Center, Card, Image, Tabs } from "@mantine/core";
import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { GridifyQueryBuilder } from "gridify-client";
import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import { Blurhash } from "react-blurhash";
import { IconLock } from "@tabler/icons-react";
import ItemOverview from "./overview";
import ItemActivity from "./activity";

export default function ItemPage() {
  const router = useRouter();
  const { ItemId } = router.query;

  const [item, setItem] = useState<ItemsWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorImage, setErrorImage] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("overview");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!ItemId || Array.isArray(ItemId)) return;
      setLoading(true);
      setError(null);
      try {
        const res = await client.Api.getLibraryItems(new GridifyQueryBuilder().addCondition("Id", "=", ItemId as string).build());
        if (!mounted) return;
        const found = (res?.data && res.data.length > 0 && res.data[0]) || null;
        setItem(found);
      } catch (er: any) {
        console.error(er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [ItemId]);

  if (!ItemId || Array.isArray(ItemId)) return null;

  return (
    <div style={{ padding: 20 }}>
      {loading && (
        <Center>
          <Loader />
        </Center>
      )}

      {error && <Text color="red">Error loading item: {error}</Text>}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ width: 160, minWidth: 160 }}>
              <div style={{ width: 160, height: 240, borderRadius: 8, overflow: "hidden", background: "#222" }}>
                {!errorImage ? (
                  <Image
                    src={`${client.API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(item?.parent?.id ?? item?.id ?? "")}&Width=600&ServerId=${encodeURIComponent(item?.serverId ?? "")}`}
                    alt={item?.name ?? ""}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={() => {
                      setErrorImage(true);
                    }}
                  />
                ) : (
                  <Blurhash
                    hash={item?.imageHash && item.imageHash.length > 6 ? item.imageHash : "LEHV6nWB2yk8pyo0adR*.7kCMdnj"}
                    width={"100%"}
                    height={"100%"}
                    className="rounded-top-3 overflow-hidden position-absolute"
                  />
                )}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <Group>
                <Title order={2}>{item?.name ?? ItemId}</Title>
                {item?.archived && <IconLock size={20} color="orange" />}
              </Group>
              {/* <Text color="dimmed" style={{ marginTop: 8 }}>
                {item?.overview ?? ""}
              </Text> */}

              <Tabs value={activeTab} onChange={setActiveTab} style={{ marginTop: 12 }}>
                <Tabs.List>
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="activity">Activity</Tabs.Tab>
                  {/* <Tabs.Tab value="options">Options</Tabs.Tab> */}
                </Tabs.List>
              </Tabs>
            </div>
          </div>

          <Tabs value={activeTab} keepMountedMode="display-none">
            <Tabs.Panel value="overview">
              <ItemOverview item={item} />
            </Tabs.Panel>

            <Tabs.Panel value="activity">
              <ItemActivity item={item} />
            </Tabs.Panel>
            {/* 
            <Tabs.Panel value="options">
              <div style={{ marginTop: 16 }}>
                <Title order={3}>Options</Title>
                <Text color="dimmed">Library options and settings go here.</Text>
              </div>
            </Tabs.Panel> */}
          </Tabs>
        </>
      )}
    </div>
  );
}
