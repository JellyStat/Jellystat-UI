import { useEffect, useState } from "react";
import client from "@/lib/api";
import type { ReportImageBinding } from "@/lib/models/reports";
import { findData } from "@/lib/reports/format";
import type { RenderContext } from "./ReportElementView";

/** Same rules as ReportImageResolver.BindingId on the server: parameter, else first row of a data source, else fixed id. */
export function mediaBindingId(binding: ReportImageBinding, model: RenderContext): string | null {
  let value: unknown = null;
  if (binding.parameter) {
    const key = Object.keys(model.parameters).find((k) => k.toLowerCase() === binding.parameter!.toLowerCase());
    value = key ? model.parameters[key] : null;
    // Multi-select lookups: use the first choice
    if (Array.isArray(value)) {
      value = value[0];
    } else if (typeof value === "string" && value.includes(", ")) {
      value = value.split(", ")[0];
    }
  } else if (binding.dataSourceId) {
    const data = findData(model, binding.dataSourceId);
    const column = data?.columns.find((c) => c.name.toLowerCase() === (binding.field ?? "").toLowerCase());
    value = data && column && data.rows.length > 0 ? data.rows[0][column.name] : null;
  } else {
    value = binding.id;
  }
  const id = value === null || value === undefined ? "" : String(value).trim();
  return id || null;
}

/** A poster, backdrop or avatar from the media server, loaded through Jellystat's image proxy. */
export default function MediaImage({
  binding,
  model,
  width,
  fit,
  alt,
}: {
  binding: ReportImageBinding;
  model: RenderContext;
  width: number;
  fit: string;
  alt: string;
}) {
  const id = mediaBindingId(binding, model);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const fetchWidth = Math.min(2000, Math.max(100, Math.ceil(width * 2)));

  useEffect(() => {
    setFailed(false);
    if (!id) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    const load =
      binding.type === "user"
        ? client.Proxy.user.getUserPrimary(undefined, id, fetchWidth)
        : binding.imageType === "Backdrop"
          ? client.Proxy.items.getItemBackdrop(undefined, id, fetchWidth)
          : client.Proxy.items.getItemPrimary(undefined, id, fetchWidth);
    load
      .then((blob) => {
        if (cancelled || !blob.type.startsWith("image/")) {
          if (!cancelled) {
            setFailed(true);
          }
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, binding.type, binding.imageType, fetchWidth]);

  if (!url) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-center px-2"
        style={{ background: "#f3f4f6", color: "#9ca3af", fontSize: 12 }}
      >
        {!id ? "No image id" : failed ? "Image not available" : ""}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      className="w-full h-full block select-none"
      style={{ objectFit: fit === "cover" ? "cover" : fit === "fill" ? "fill" : "contain" }}
    />
  );
}
