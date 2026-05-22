import { Container, Loader, Image } from "@mantine/core";
import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { IconLock } from "@tabler/icons-react";
import classes from "./ItemImage.module.css";

export default function ItemImage({
  imageUrl,
  imageHash,
  archived = false,
  width = "100%",
  height = 250,
  onClick,
}: {
  imageUrl: string;
  imageHash: string | undefined | null;
  archived?: boolean;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <Container
      w={width}
      h={height}
      display="flex"
      flex="0 0 auto"
      p={0}
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderTopLeftRadius: 8,
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      className={classes.container}
    >
      <Container pos="relative" w="100%" h="100%" p={0} style={{ boxSizing: "border-box" }}>
        {(!imageLoaded || imageError) && (
          <Container
            pos="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
            p={0}
            style={{
              zIndex: 2,
              borderTopLeftRadius: 8,
              overflow: "hidden",
            }}
          >
            {imageHash && imageHash.length > 6 && (
              <Blurhash
                hash={imageHash}
                width="100%"
                height="100%"
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "block" }}
              />
            )}

            <Container
              pos="absolute"
              left={0}
              right={0}
              top={0}
              bottom={0}
              display="flex"
              style={{
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
              }}
            >
              {!imageLoaded && !imageError && <Loader size="lg" />}
              {!imageLoaded && imageError && archived && <IconLock size={48} />}
            </Container>
          </Container>
        )}

        <Image
          src={imageUrl}
          alt={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: imageError ? "none" : "block",
            position: "relative",
            zIndex: 1,
            transition: "opacity 200ms ease",
            borderTopLeftRadius: 8,
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
      </Container>
    </Container>
  );
}
