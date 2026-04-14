"use client";

interface ImageSelectorProps {
  images: string[];
  thumbnail: string | null;
  onSelect: (url: string | null) => void;
}

export function ImageSelector({ images, thumbnail, onSelect }: ImageSelectorProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">대표 이미지 선택</p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url) => (
          <button
            key={url}
            onClick={() => onSelect(thumbnail === url ? null : url)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
              thumbnail === url ? "border-accent" : "border-transparent hover:border-border"
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            {thumbnail === url && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-medium text-white bg-accent px-2 py-1 rounded">대표</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
