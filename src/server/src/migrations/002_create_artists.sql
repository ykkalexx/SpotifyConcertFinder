CREATE TABLE artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    genres JSON,    -- Changed from TEXT[] to JSON for array storage
    popularity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_artist_spotify_id ON artists(spotify_id);