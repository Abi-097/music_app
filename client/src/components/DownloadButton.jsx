import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { safeFileName } from '../lib/format';
import useRequireAuth from '../hooks/useRequireAuth';

// Downloads the track as an MP3 file for offline listening.
export default function DownloadButton({ track, withLabel = false }) {
  const requireAuth = useRequireAuth();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!requireAuth() || busy) return;
    setBusy(true);
    const toastId = toast.loading('Preparing download…');
    try {
      const { data } = await api.get(`/tracks/${track._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName(`${track.artist} - ${track.title}`)}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download complete', { id: toastId });
    } catch {
      toast.error('Download failed. Please try again.', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={download} disabled={busy} aria-label="Download" title="Download" className={withLabel ? 'btn-ghost' : 'icon-btn'}>
      <FiDownload />
      {withLabel && <span>{busy ? 'Downloading…' : 'Download'}</span>}
    </button>
  );
}
