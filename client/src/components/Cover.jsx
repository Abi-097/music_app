import { useState } from 'react';
import { FiMusic } from 'react-icons/fi';

// Album art with a graceful fallback when the image is missing or fails to load.
export default function Cover({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-500 ${className}`}>
        <FiMusic />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-zinc-800 object-cover ${className}`}
    />
  );
}
