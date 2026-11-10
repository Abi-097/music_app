// Loads demo tracks into MongoDB:  npm run seed
//
// The titles, artists, albums and movies below are made-up demo metadata.
// Audio comes from SoundHelix (https://www.soundhelix.com), which provides free sample songs for demos.
// Replace audioUrl / coverUrl with your own hosted files for a real catalogue.
// WARNING: this deletes all existing tracks (and their likes) before inserting.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Track from './models/Track.js';

// [title, artist, album, movie, genre]
const rows = [
  ['Neon Skyline', 'Aurora Vale', 'City Lights', '', 'Pop'],
  ['Paper Hearts', 'Aurora Vale', 'City Lights', '', 'Pop'],
  ['Golden Hour Runaway', 'Mika Rowan', 'Sunday Static', '', 'Pop'],
  ['Sugar Static', 'Mika Rowan', 'Sunday Static', 'Summer Rewind', 'Pop'],
  ['Thunder Road Home', 'The Copper Wolves', 'Iron & Ember', '', 'Rock'],
  ['Burn the Map', 'The Copper Wolves', 'Iron & Ember', '', 'Rock'],
  ['Hollow Crown', 'Static Parade', 'Loud Quiet', 'Last Encore', 'Rock'],
  ['Wire & Wine', 'Static Parade', 'Loud Quiet', '', 'Rock'],
  ['Pulse Engine', 'Kairo', 'Circuit Bloom', '', 'Electronic'],
  ['Glass Horizon', 'Kairo', 'Circuit Bloom', 'Orbit Nine', 'Electronic'],
  ['Afterimage', 'Lumen Drift', 'Night Signal', '', 'Electronic'],
  ['Voltage Garden', 'Lumen Drift', 'Night Signal', '', 'Electronic'],
  ['Concrete Crown', 'Delta Ray', 'Block Parties', '', 'Hip-Hop'],
  ['Lantern Flow', 'Delta Ray', 'Block Parties', 'Street Symphony', 'Hip-Hop'],
  ['Midnight Cypher', 'Nova Jin', 'Late Bars', '', 'Hip-Hop'],
  ['Blue Room Blues', 'The Velvet Quartet', 'After Hours', '', 'Jazz'],
  ['Smoke & Satin', 'The Velvet Quartet', 'After Hours', 'Café Noir', 'Jazz'],
  ['Slow Tide', 'Ines Calloway', 'Harbor Notes', '', 'Jazz'],
  ['Nocturne in Rain', 'Elias Brandt', 'Seasons on Keys', '', 'Classical'],
  ['Allegro for Dawn', 'Elias Brandt', 'Seasons on Keys', 'The Winter Garden', 'Classical'],
  ['Strings of Autumn', 'Marlowe Chamber Orchestra', 'Four Rooms', '', 'Classical'],
  ['River Road Lullaby', 'Hazel & Pine', 'Porch Light', '', 'Folk'],
  ['Wildflower Mile', 'Hazel & Pine', 'Porch Light', 'Homeward', 'Folk'],
  ['Rainy Window Study', 'Soft Orbit', 'Chill Hours', '', 'Lo-fi'],
  ['Tea Steam Loop', 'Soft Orbit', 'Chill Hours', '', 'Lo-fi'],
  ['Cassette Sunrise', 'Pixel Moth', 'Slow Mornings', '', 'Lo-fi'],
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const tracks = rows.map(([title, artist, album, movie, genre], i) => ({
  title,
  artist,
  album,
  movie,
  genre,
  audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 16) + 1}.mp3`,
  coverUrl: `https://picsum.photos/seed/${slug(album || title)}/400/400`,
  plays: Math.floor(Math.random() * 5000),
}));

try {
  await connectDB();
  await Track.deleteMany({});
  await Track.insertMany(tracks);
  console.log(`Seeded ${tracks.length} tracks.`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
