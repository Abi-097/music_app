import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Social sharing. `path` is an in-app path such as "/track/123".
// Facebook and Twitter/X support share links. Instagram has no web share link,
// so that button copies the link and opens Instagram for the user to paste it.
export default function ShareButtons({ title, path }) {
  const url = `${window.location.origin}${path}`;
  const text = `Listen to "${title}" on Wavely`;
  const enc = encodeURIComponent;

  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
      return true;
    } catch {
      toast.error('Could not copy the link');
      return false;
    }
  };

  const instagram = async () => {
    if (await copy()) {
      toast('Link copied. Paste it in your Instagram story, post or message.');
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm text-zinc-400">Share</span>
      <button className="icon-btn bg-zinc-800" aria-label="Share on Facebook" title="Facebook"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)}>
        <FaFacebookF />
      </button>
      <button className="icon-btn bg-zinc-800" aria-label="Share on Twitter" title="Twitter"
        onClick={() => open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`)}>
        <FaTwitter />
      </button>
      <button className="icon-btn bg-zinc-800" aria-label="Share on Instagram" title="Instagram" onClick={instagram}>
        <FaInstagram />
      </button>
      <button className="icon-btn bg-zinc-800" aria-label="Copy link" title="Copy link" onClick={copy}>
        <FiLink />
      </button>
    </div>
  );
}
