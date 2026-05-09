"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/actions/trades";
import { cn } from "@/lib/utils";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function ScreenshotField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState<string>(defaultValue ?? "");
  const [pending, startUpload] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Only PNG, JPEG, WebP, or GIF");
      return;
    }
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImage(fd);
      if (res.ok && res.url) {
        setUrl(res.url);
        toast.success("Screenshot uploaded");
      } else {
        toast.error(res.error ?? "Upload failed");
      }
    });
  }

  // Window-level paste handler — only intercepts when clipboard contains an image
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            uploadFile(file);
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function onChooseFile() {
    fileInputRef.current?.click();
  }

  function clear() {
    setUrl("");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />

      {url ? (
        <div className="rounded-lg border border-border overflow-hidden bg-black/40 relative group">
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="block"
          >
            <Image
              src={url}
              alt="Trade screenshot"
              width={1200}
              height={800}
              unoptimized
              className="w-full h-auto max-h-64 object-contain"
            />
          </a>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={clear}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove screenshot"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onChooseFile}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "w-full rounded-lg border border-dashed border-border bg-secondary/30 hover:bg-secondary/50 transition-colors px-4 py-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer",
            dragOver && "border-primary bg-primary/10",
            pending && "opacity-60 cursor-wait"
          )}
        >
          {pending ? (
            <Loader2 className="size-5 text-muted-foreground animate-spin" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
          <div className="text-sm">
            <span className="font-medium">Drop, paste, or click</span>
            <span className="text-muted-foreground"> to upload a screenshot</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            PNG, JPEG, WebP, GIF · max 10 MB
          </div>
        </button>
      )}

      <Input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="text-xs h-8"
      />
    </div>
  );
}
