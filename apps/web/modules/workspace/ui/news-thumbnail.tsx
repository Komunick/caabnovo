"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";

export function NewsThumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="home-news-image" aria-hidden="true">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Newspaper size={30} strokeWidth={1.5} />
      )}
    </span>
  );
}
