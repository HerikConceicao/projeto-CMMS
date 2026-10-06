interface PhotoGalleryProps {
  title: string;
  photos: string[];
}

export function PhotoGallery({ title, photos }: PhotoGalleryProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">{title}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <a
            key={index}
            href={photo}
            target="_blank"
            rel="noreferrer"
            className="block h-20 w-20 overflow-hidden rounded-lg border border-zinc-800"
          >
            <img src={photo} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}
