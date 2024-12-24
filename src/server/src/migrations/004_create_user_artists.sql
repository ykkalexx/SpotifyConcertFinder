CREATE TABLE user_artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    artist_id INT,
    last_listened TIMESTAMP,
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_artist (user_id, artist_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE INDEX idx_user_artists_user ON user_artists(user_id);
CREATE INDEX idx_user_artists_artist ON user_artists(artist_id);