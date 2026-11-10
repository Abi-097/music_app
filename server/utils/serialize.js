// Turns a lean Track document into the shape the client expects:
// the raw `likes` array is replaced by `likesCount` and a per-user `liked` flag.
export const serializeTrack = (track, userId) => {
  const { likes = [], __v, ...rest } = track;
  return {
    ...rest,
    likesCount: likes.length,
    liked: userId ? likes.some((id) => String(id) === String(userId)) : false,
  };
};

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
