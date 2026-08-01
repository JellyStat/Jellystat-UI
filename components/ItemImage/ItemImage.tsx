import React, { useState } from "react";
import { Blurhash } from "react-blurhash";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");

  return (
    <div
      onClick={onClick}
      className={`relative flex-none overflow-hidden bg-surface-hover transition-colors ${onClick ? "cursor-pointer group" : ""}`}
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
          <div className="absolute z-30 flex items-center justify-center text-gray-500 drop-shadow-md">
            {!imageLoaded && !imageError && (
              <Loader2 size={32} className="animate-spin text-brand-cyan drop-shadow-[0_0_10px_rgba(0,164,220,0.5)]" />
            )}
            {!imageLoaded && imageError && !archived && PlaceHolderIcon && <PlaceHolderIcon size={48} className="opacity-30" />}
          </div>
        </div>
      )}

      {/* Actual Image */}

      <div className="relative w-full aspect-2/3 overflow-hidden transition-all duration-300 group-hover:shadow-brand-cyan/20  group-hover:shadow-xl shrink-0">
        {/* Background Image */}
        <img
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${onClick ? "group-hover:scale-105" : ""}`}
          // style={{ backgroundImage: `url('${imageUrl}')` }}
          src={imageUrl}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />

        {/* Inner shadow overlay for depth */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"></div>

        {/* Archived Badge (if applicable) */}
        {archived && (
          <div className="absolute top-2 right-2 z-20 bg-black/80 backdrop-blur-md text-[10px] font-bold text-gray-300 px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest shadow-lg">
            {t("item.archived", "Archived")}
          </div>
        )}
      </div>
    </div>
  );
}
