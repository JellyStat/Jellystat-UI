import { Container, Loader, Image, MantineStyleProps, ElementProps } from "@mantine/core";
import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { IconLock, IconPhoto } from "@tabler/icons-react";
import classes from "./ItemImage.module.css";

export default function ItemImage({
  imageUrl,
  imageHash,
  archived = false,
  width = "100%",
  height = 250,
  PlaceHolderIcon = IconPhoto,
  onClick,
  borderRadius = [8, 0, 0, 0],
}: {
  imageUrl: string;
  imageHash: string | undefined | null;
  archived?: boolean;
  width?: number | string;
  height?: number | string;
  PlaceHolderIcon?: React.ElementType;
  onClick?: () => void;
  borderRadius?: number[];
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
        borderTopLeftRadius: borderRadius[0],
        borderTopRightRadius: borderRadius[1],
        borderBottomRightRadius: borderRadius[2],
        borderBottomLeftRadius: borderRadius[3],
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      className={onClick ? classes.container : undefined}
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
              borderTopLeftRadius: borderRadius[0],
              borderTopRightRadius: borderRadius[1],
              borderBottomRightRadius: borderRadius[2],
              borderBottomLeftRadius: borderRadius[3],
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
              {!imageLoaded && imageError && !archived && PlaceHolderIcon && <PlaceHolderIcon size={48} />}
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
            borderTopLeftRadius: borderRadius[0],
            borderTopRightRadius: borderRadius[1],
            borderBottomRightRadius: borderRadius[2],
            borderBottomLeftRadius: borderRadius[3],
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
