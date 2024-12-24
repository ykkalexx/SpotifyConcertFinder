CREATE TABLE concerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticketmaster_id VARCHAR(255) UNIQUE NOT NULL,
    artist_id INT,
    venue_name VARCHAR(255),
    venue_city VARCHAR(255),
    venue_country VARCHAR(255),
    date TIMESTAMP,
    ticket_url TEXT,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE INDEX idx_concert_date ON concerts(date);
CREATE INDEX idx_concert_artist ON concerts(artist_id);