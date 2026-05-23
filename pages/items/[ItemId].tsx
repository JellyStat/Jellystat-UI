import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader, Text, Group, Center, Image, Tabs, ActionIcon } from "@mantine/core";
import client from "@/lib/api.ts";
import { ItemsWithStats } from "@/lib/models/itemsWithStats.ts";
import { GridifyQueryBuilder } from "gridify-client";
import { Blurhash } from "react-blurhash";
import { IconExternalLink, IconLock } from "@tabler/icons-react";
import ItemOverview from "./overview.tsx";
import ItemActivity from "./activity.tsx";
import NotFound from "@/components/ErrorCards/NotFound.tsx";
import { Server } from "@/lib/models/server.ts";
import configManager from "@/lib/configManager.ts";
import ItemTypes from "@/lib/models/enums/ItemTypes.ts";
import ItemMedia from "./media.tsx";

export default function ItemPage() {
  const router = useRouter();
  const { ItemId } = router.query;

  const [item, setItem] = useState<ItemsWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorImage, setErrorImage] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("overview");

  const [config, setConfig] = useState<Server | null>(null);

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
        var config = await configManager.getActiveConfig();

        setConfig(config);
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

  if (!item && !loading && !error) {
    console.error("No ItemId provided in query");
    return <NotFound title="Item not found" message={`Item with id ${ItemId} could not be found`} />;
  }

  const externalURLBase = config?.externalURL && config?.externalURL.trim().length > 0 ? config.externalURL : config?.url;
  const isValidParent = item && item.parent && item.parent.id && item.parent.id !== item.id && item.parent.name;
  const title = isValidParent ? item?.parent?.name : item?.name;
  const subtitle = isValidParent ? item?.name : null;
  const parentIndexUnit = isValidParent && item.type == ItemTypes.Episode ? "Season" : null;
  const indexUnit = item?.type == ItemTypes.Episode ? "Episode" : null;
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
                    width="100%"
                    height="100%"
                    className="rounded-top-3 overflow-hidden position-absolute"
                  />
                )}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <Group>
                <Group align="start" style={{ flexDirection: "column" }}>
                  <Group align="start" gap={4}>
                    <Text
                      component={item?.parentId ? "a" : undefined}
                      href={`/items/${item?.parentId}`}
                      style={{ fontWeight: "bold", fontSize: 32 }}
                    >
                      {title}
                    </Text>
                    {config && item && (
                      <ActionIcon
                        variant="transparent"
                        component="a"
                        href={`${externalURLBase}/web/index.html#/details?id=${item?.id}&serverId=${item?.serverId}`}
                        target="_blank"
                      >
                        <IconExternalLink size={20} />
                      </ActionIcon>
                    )}
                  </Group>
                  {isValidParent && (
                    <Group gap={4}>
                      {parentIndexUnit && (
                        <Text
                          component={item.parentId ? "a" : undefined}
                          href={`/items/${item.parentId}`}
                          style={{ fontWeight: "bold" }}
                        >
                          {parentIndexUnit + " " + item.parentIndex}
                        </Text>
                      )}
                      {indexUnit && <Text>{indexUnit + " " + item.index}</Text>}
                      {parentIndexUnit || indexUnit ? <Text color="dimmed">-</Text> : null}
                      <Text>{subtitle}</Text>
                    </Group>
                  )}
                  {item?.path && (
                    <Text color="dimmed" size="sm" style={{ fontStyle: "italic" }}>
                      File Path: {item.path}
                    </Text>
                  )}
                  {item?.duration && (
                    <Text color="dimmed" size="sm" style={{ fontStyle: "italic" }}>
                      Runtime: {item.duration.ticksToDurationString()}
                    </Text>
                  )}{" "}
                  {item?.size && (
                    <Text color="dimmed" size="sm" style={{ fontStyle: "italic" }}>
                      Size: {item.size.formatBytes()}
                    </Text>
                  )}
                </Group>

                {item?.archived && <IconLock size={20} color="orange" />}
              </Group>
              {/* <Text color="dimmed" style={{ marginTop: 8 }}>
                {item?.overview ?? ""}
              </Text> */}

              <Tabs value={activeTab} onChange={setActiveTab} style={{ marginTop: 12 }}>
                <Tabs.List>
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  {item && [ItemTypes.Season, ItemTypes.Series].includes(item.type) && <Tabs.Tab value="media">Media</Tabs.Tab>}
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

            {item && [ItemTypes.Season, ItemTypes.Series].includes(item.type) && (
              <Tabs.Panel value="media">
                <ItemMedia item={item} />
              </Tabs.Panel>
            )}
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
