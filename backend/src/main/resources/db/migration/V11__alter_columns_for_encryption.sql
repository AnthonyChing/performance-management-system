-- Alter performance_reviews columns to VARCHAR to store Base64 encrypted strings

-- final_rating was rating_scale_enum, we cast it to text
ALTER TABLE performance_reviews
  ALTER COLUMN final_rating TYPE VARCHAR(255) USING final_rating::text;

-- kpi_score was NUMERIC(6,2), cast to text
ALTER TABLE performance_reviews
  ALTER COLUMN kpi_score TYPE VARCHAR(255) USING kpi_score::text;

-- review_score was NUMERIC(6,2), cast to text
ALTER TABLE performance_reviews
  ALTER COLUMN review_score TYPE VARCHAR(255) USING review_score::text;
