CREATE TABLE user_artists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  artist_id INTEGER REFERENCES artists(id),
  last_listened TIMESTAMP,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_user_artists_user ON user_artists(user_id);
CREATE INDEX idx_user_artists_artist ON user_artists(artist_id);