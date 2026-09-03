"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import { getCroppedBlob } from "@/lib/crop-image";

export function AvatarPicker({
  action,
  hasPhoto,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hasPhoto: boolean;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_area: Area, px: Area) => setAreaPx(px), []);

  function accept() {
    if (!src || !areaPx) return;
    startTransition(async () => {
      const blob = await getCroppedBlob(src, areaPx);
      const fd = new FormData();
      fd.append("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      await action(fd);
      setSrc(null);
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onFile}
        className="hidden"
      />
      <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
        <ImagePlus size={16} />
        {hasPhoto ? t("perfil.changePhoto") : t("perfil.uploadPhoto")}
      </Button>

      {src && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="mb-3 text-sm font-medium text-navy">{t("perfil.cropTitle")}</p>
            <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-[var(--radius-card)] bg-gray-100">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-4 w-full accent-navy"
              aria-label={t("perfil.zoom")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSrc(null)}
                disabled={pending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={accept} disabled={pending}>
                {pending ? t("perfil.uploading") : t("common.accept")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
