import { usePlayer } from '../context/PlayerContext';

const RATES = [0.75, 1, 1.25, 1.5, 2];

// Customizable playback settings. Changes apply immediately and are remembered on this device.
export default function PlaybackSettings() {
  const { settings, updateSettings } = usePlayer();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Streaming quality</span>
        <select
          className="input"
          value={settings.quality}
          onChange={(e) => updateSettings({ quality: e.target.value })}
        >
          <option value="high">High (best sound)</option>
          <option value="low">Data saver (uses a lower-bitrate stream when available)</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Playback speed</span>
        <select
          className="input"
          value={settings.rate}
          onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
        >
          {RATES.map((r) => (
            <option key={r} value={r}>
              {r === 1 ? 'Normal (1×)' : `${r}×`}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-emerald-400"
          checked={settings.autoplay}
          onChange={(e) => updateSettings({ autoplay: e.target.checked })}
        />
        <span className="text-sm">Automatically play the next track</span>
      </label>
    </div>
  );
}
