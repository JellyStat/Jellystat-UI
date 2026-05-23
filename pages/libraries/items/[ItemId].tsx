import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader, Text, Group, Center, Image, Tabs, ActionIcon, Stack, Button, BackgroundImage } from "@mantine/core";
import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { GridifyQueryBuilder } from "gridify-client";
import { Blurhash } from "react-blurhash";
import { IconExternalLink, IconLock } from "@tabler/icons-react";
import ItemOverview from "./overview";
import ItemActivity from "./activity";
import NotFound from "@/components/ErrorCards/NotFound";
import { Server } from "@/lib/models/server";
import configManager from "@/lib/configManager";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemMedia from "./media";
import ItemImage from "@/components/ItemImage/ItemImage";

export default function ItemPage() {
  const router = useRouter();
  const { ItemId } = router.query;

  const [item, setItem] = useState<ItemsWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const imageUrl = `${client.API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(item?.parent?.id ?? item?.id ?? "")}&Width=600&ServerId=${encodeURIComponent(item?.serverId ?? "")}`;
  const backgroundImage = `${client.API_BASE}Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(item?.parent?.id ?? item?.id ?? "")}&Width=900&Quality=90&ServerId=${encodeURIComponent(item?.serverId ?? "")}`;
  return (
    <div style={{ padding: 20 }}>
      {loading && (
        <Center>
          <Loader />
        </Center>
      )}

      {error && <Text color="red">Error loading item: {error}</Text>}

      {!loading && !error && (
        <Stack>
          <BackgroundImage
            src={backgroundImage}
            style={{ borderRadius: 8, backgroundSize: "cover", backgroundPosition: "top" }}
            mb={12}
          >
            <Stack
              style={{
                padding: 20,
                backgroundColor: "light-dark(rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0.8))",
                borderRadius: 8,
              }}
            >
              <Button onClick={() => router.push(`/libraries/${item?.libraryId}`)} style={{ width: "fit-content" }}>
                {item?.library?.name}
              </Button>
              <Group gap={16} style={{ alignItems: "start" }}>
                <ItemImage imageUrl={imageUrl} imageHash={item?.imageHash} width={200} height={300} borderRadius={[8, 8, 8, 8]} />

                <Stack flex={1}>
                  <Group>
                    <Stack>
                      <Group align="start" gap={4}>
                        <Text
                          component={item?.parentId ? "a" : undefined}
                          href={`/libraries/items/${item?.parentId}`}
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
                              href={`/libraries/items/${item.parentId}`}
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
                      )}

                      {item?.size && (
                        <Text color="dimmed" size="sm" style={{ fontStyle: "italic" }}>
                          Size: {item.size.formatBytes()}
                        </Text>
                      )}
                    </Stack>

                    {item?.archived && <IconLock size={20} color="orange" />}
                  </Group>

                  <Tabs value={activeTab} onChange={setActiveTab} style={{ marginTop: 12 }}>
                    <Tabs.List>
                      <Tabs.Tab value="overview">Overview</Tabs.Tab>
                      {item && [ItemTypes.Season, ItemTypes.Series].includes(item.type) && (
                        <Tabs.Tab value="media">Media</Tabs.Tab>
                      )}
                      <Tabs.Tab value="activity">Activity</Tabs.Tab>
                      {/* <Tabs.Tab value="options">Options</Tabs.Tab> */}
                    </Tabs.List>
                  </Tabs>
                </Stack>
              </Group>
            </Stack>
          </BackgroundImage>
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
        </Stack>
      )}
    </div>
  );
}
