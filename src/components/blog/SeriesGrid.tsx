import { SeriesCard } from "./SeriesCard";

interface SeriesItem {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  postCount: number;
  lastUpdated: string;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
  showTitleOnThumbnail?: boolean | null;
}

export function SeriesGrid({ series }: { series: SeriesItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {series.map((s) => (
        <SeriesCard key={s.id} {...s} />
      ))}
    </div>
  );
}
