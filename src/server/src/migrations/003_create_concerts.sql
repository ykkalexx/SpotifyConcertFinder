CREATE TABLE concerts (
  id SERIAL PRIMARY KEY,
  ticketmaster_id VARCHAR(255) UNIQUE NOT NULL,
  artist_id INTEGER REFERENCES artists(id),
  venue_name VARCHAR(255),
  venue_city VARCHAR(255),
  venue_country VARCHAR(255),
  date TIMESTAMP,
  ticket_url TEXT,
  price_range_min DECIMAL,
  price_range_max DECIMAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_concert_date ON concerts(date);
CREATE INDEX idx_concert_artist ON concerts(artist_id);