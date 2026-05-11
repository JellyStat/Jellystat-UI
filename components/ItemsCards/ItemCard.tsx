import React from "react";
import { Card, Text, Badge, Image, Skeleton, Loader } from "@mantine/core";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/router";
import { Blurhash } from "react-blurhash";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { IconLock } from "@tabler/icons-react";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
};

export const ItemCard: React.FC<Props> = ({ item, width = 220 }) => {
  const router = useRouter();
  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=600&ServerId=${encodeURIComponent(serverId)}`;

  const indexString = item.parentIndex != null ? `S${item.parentIndex} - E${item.index}` : "";
  const title = isValidParent ? item.parent!.name : item.name;
  const twelve_hr = typeof window !== "undefined" ? new Intl.DateTimeFormat().resolvedOptions().hour12 : false;
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: twelve_hr,
  };

  return (
    <Card
      shadow="sm"
      p={0}
      style={{
        width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={() => {
        router.push(`/libraries/${encodeURIComponent(item.libraryId)}/items/${encodeURIComponent(item.id)}`);
        console.log("Item clicked:", item);
      }}
    >
      <div
        style={{
          width: "100%",
          height: 250,
          background: "#222",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          overflow: "hidden",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", boxSizing: "border-box" }}>
          {(!imageLoaded || imageError) && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 2,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                overflow: "hidden",
              }}
            >
              <Blurhash
                hash={item.imageHash ?? "LEHV6nWB2yk8pyo0adR*.7kCMdnj"}
                width={"100%"}
                height={"100%"}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "block" }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                }}
              >
                {!imageLoaded && !imageError && <Loader size="lg" />}
                {!imageLoaded && imageError && item.archived && <IconLock size={48} />}
              </div>
            </div>
          )}

          <Image
            src={imageUrl}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              position: "relative",
              zIndex: 1,
              transition: "opacity 200ms ease",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              overflow: "hidden",
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
            onLoad={() => {
              setImageError(false);
              setImageLoaded(true);
            }}
          />
        </div>
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 auto" }}>
        <Text size="xs" color="blue" style={{ paddingBottom: 10 }}>
          {item.dateCreated ? new Date(item.dateCreated).toLocaleString(undefined, dateOptions) : ""}
        </Text>

        <Text size="sm" style={{ lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </Text>

        {isValidParent && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {item.name}
          </Text>
        )}

        {isValidParent && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {indexString}
          </Text>
        )}
      </div>
    </Card>
  );
};

export default ItemCard;
