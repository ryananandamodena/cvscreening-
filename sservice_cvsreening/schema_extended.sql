
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS ai_sentiment_score TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS ai_summary TEXT;
