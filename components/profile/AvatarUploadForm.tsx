"use client";

import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface AvatarUploadFormProps {
  currentAvatarUrl: string | null;
  fallbackLabel: string;
  uploadAction: (formData: FormData) => void | Promise<void>;
}

function initialsFromLabel(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AvatarUploadForm({
  currentAvatarUrl,
  fallbackLabel,
  uploadAction,
}: AvatarUploadFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fallbackInitials = useMemo(
    () => initialsFromLabel(fallbackLabel),
    [fallbackLabel],
  );

  return (
    <form action={uploadAction} className="space-y-4">
      <div className="flex items-center gap-4 rounded-card border border-border-subtle bg-background-secondary/70 p-4">
        {previewUrl ? (
          <Image
            alt={`Avatar de ${fallbackLabel}`}
            className="size-20 rounded-full border border-border-subtle object-cover"
            height={80}
            src={previewUrl}
            unoptimized
            width={80}
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 font-semibold uppercase tracking-[0.12em] text-accent-primary">
            {fallbackInitials}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-primary">Vista previa</p>
          <p className="text-sm leading-6 text-text-secondary">
            Sube una foto en JPG, PNG o WEBP. El límite es de 2 MB.
          </p>
        </div>
      </div>

      <label
        className={cn(
          "peer-focus-ring flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-border-strong bg-background-secondary/60 px-4 py-4 text-sm text-text-secondary transition-colors duration-200 hover:border-accent-primary/35 hover:bg-surface-active",
        )}
        htmlFor="avatar"
      >
        <ImagePlus className="size-5 text-accent-primary" strokeWidth={2} />
        <span>Selecciona una foto de perfil</span>
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="peer sr-only"
        id="avatar"
        name="avatar"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            setPreviewUrl(currentAvatarUrl);
            return;
          }

          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl((current) => {
            if (current?.startsWith("blob:")) {
              URL.revokeObjectURL(current);
            }

            return objectUrl;
          });
        }}
        type="file"
      />

      <button
        className="focus-ring inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
        type="submit"
      >
        Subir foto
      </button>
    </form>
  );
}
