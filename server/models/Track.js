import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, trim: true, default: '' },
    movie: { type: String, trim: true, default: '' },
    genre: { type: String, required: true, trim: true, index: true },
    duration: { type: Number, default: 0 }, // seconds, 0 = unknown (the player reads the real length from the file)
    audioUrl: { type: String, required: true }, // high-quality stream
    audioUrlLow: { type: String, default: '' }, // optional lower-bitrate stream; falls back to audioUrl
    coverUrl: { type: String, default: '' },
    plays: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('Track', trackSchema);
