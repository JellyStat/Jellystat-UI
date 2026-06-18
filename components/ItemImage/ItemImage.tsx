import React, { useState } from "react";
import { Blurhash } from "react-blurhash";
import { Lock, Image as ImageIcon, Loader2 } from "lucide-react";

type Props = {
  imageUrl: string;
  imageHash?: string | null;
  archived?: boolean;
  width?: number | string;
  height?: number | string;
  PlaceHolderIcon?: React.ElementType;
  onClick?: () => void;
  borderRadius?: number[];
};

export default function ItemImage({
  imageUrl,
  imageHash,
  archived = false,
  width = "100%",
  height = 250,
  PlaceHolderIcon = ImageIcon,
  onClick,
  borderRadius = [8, 0, 0, 0],
}: Props) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const radiusStyle = borderRadius.map((r) => `${r}px`).join(" ");

  return (
    <div
      onClick={onClick}
      className={`relative flex-none overflow-hidden bg-surface-hover transition-colors ${
        onClick ? "cursor-pointer group" : ""
      }`}
      style={{
        width,
        height,
        borderRadius: radiusStyle,
      }}
    >
      {/* Fallback / Loading Overlay */}
      {(!imageLoaded || imageError) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-surface">
          
          {/* Blurhash Background */}
          {imageHash && imageHash.length > 6 && (
            <Blurhash
              hash={imageHash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
              style={{ position: "absolute", inset: 0, display: "block", opacity: 0.8 }}
            />
          )}

          {/* Icons & Loading Spinners */}
          <div className="relative z-30 flex items-center justify-center text-gray-500 drop-shadow-md">
            {!imageLoaded && !imageError && (
              <Loader2 size={32} className="animate-spin text-brand-cyan drop-shadow-[0_0_10px_rgba(0,164,220,0.5)]" />
            )}
            {!imageLoaded && imageError && archived && (
              <Lock size={48} className="opacity-50 text-brand-rose" />
            )}
            {!imageLoaded && imageError && !archived && PlaceHolderIcon && (
              <PlaceHolderIcon size={48} className="opacity-30" />
            )}
          </div>

        </div>
      )}

      {/* Actual Image */}
      {!imageError && (
        <img
          src={imageUrl}
          alt="Media Cover"
          className={`absolute inset-0 z-10 w-full h-full object-cover transition-all duration-500 ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${onClick ? "group-hover:scale-105" : ""}`}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
}