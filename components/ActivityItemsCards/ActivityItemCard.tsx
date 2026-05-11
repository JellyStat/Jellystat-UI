import React from "react";
import { Card, Text, Image, Loader } from "@mantine/core";
import { API_BASE } from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { Blurhash } from "react-blurhash";
import { useRouter } from "next/router";
import { IconLock } from "@tabler/icons-react";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
};

export const ActivityItemCard: React.FC<Props> = ({ item, width = 220 }) => {
  const imageId = item.parent?.id ?? item.id;
  const serverId = item.serverId;
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const router = useRouter();

  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(imageId)}&Width=600&ServerId=${encodeURIComponent(serverId)}`;

  const indexString = item.parentIndex != null ? `S${item.parentIndex} - E${item.index}` : "";
  const title = item.name;
  const difference = item.latestActivity?.dateCreated ? Date.now() - new Date(item.latestActivity.dateCreated).getTime() : null;
  const differenceString = formatTime(difference);
  const twelve_hr = typeof window !== "undefined" ? new Intl.DateTimeFormat().resolvedOptions().hour12 : false;
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: twelve_hr,
  };

  function formatTime(time: number | null) {
    if (time === null) return "Unknown";

    // time is milliseconds difference (Date.now() - pastDate)
    const totalSeconds = Math.floor(Math.abs(time) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days} ${days > 1 ? "Days" : "Day"} Ago`;
    if (hours > 0) return `${hours} ${hours > 1 ? "Hours" : "Hour"} Ago`;
    if (minutes > 0) return `${minutes} ${minutes > 1 ? "Minutes" : "Minute"} Ago`;
    return `${seconds} ${seconds > 1 ? "Seconds" : "Second"} Ago`;
  }

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
                hash={item.imageHash && item.imageHash.length > 6 ? item.imageHash : "LEHV6nWB2yk8pyo0adR*.7kCMdnj"}
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
        <Text size="xs" color="blue">
          {item.latestActivity?.dateCreated ? differenceString : ""}
        </Text>

        <Text size="xs" color="blue" style={{ paddingBottom: 10 }}>
          {item.latestActivity?.userName ?? "N/A"}
        </Text>

        <Text size="sm" style={{ lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </Text>

        {item.parentIndex && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {indexString}
          </Text>
        )}
      </div>
    </Card>
  );
};

export default ActivityItemCard;
