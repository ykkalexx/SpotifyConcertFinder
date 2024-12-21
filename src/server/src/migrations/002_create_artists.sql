CREATE TABLE artists (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    genres TEXT[],
    popularity INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artist_spotify_id ON artists(spotify_id);