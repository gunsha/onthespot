export interface ItemMetadata {
  title?: string;
  track_title?: string;
  tracktitle?: string;
  album_name?: string;
  album?: string;
  artists?: string;
  album_artists?: string;
  album_type?: string; // e.g. "single", "compilation"
  release_year?: string | number;
  year?: string | number;
  explicit?: boolean;

  disc_number?: number;
  track_number?: number;
  total_discs?: number;
  total_tracks?: number;

  genre?: string;
  label?: string;
  copyright?: string;
  description?: string;
  language?: string;
  isrc?: string;
  length?: number | string;
  bpm?: string | number;
  key?: string;
  upc?: string;
  time_signature?: string | number;

  image_url?: string;
  item_url?: string;
  lyrics?: string;

  // Audio specific additional attributes
  acousticness?: number;
  danceability?: number;
  energy?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
  valence?: number;

  // Show / Movie specific attributes
  show_name?: string;
  season_number?: number;
  episode_number?: number;
}
