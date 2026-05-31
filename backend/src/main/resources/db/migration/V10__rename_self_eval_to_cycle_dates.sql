-- Replace self-eval date columns with cycle start/end dates.
-- Backfill any NULLs with a sentinel before restoring NOT NULL.
UPDATE performance_cycles SET self_eval_start = '1970-01-01T00:00:00Z' WHERE self_eval_start IS NULL;
UPDATE performance_cycles SET self_eval_end   = '1970-01-01T00:00:00Z' WHERE self_eval_end   IS NULL;

ALTER TABLE performance_cycles
    RENAME COLUMN self_eval_start TO cycle_start;
ALTER TABLE performance_cycles
    RENAME COLUMN self_eval_end TO cycle_end;

ALTER TABLE performance_cycles
    ALTER COLUMN cycle_start SET NOT NULL,
    ALTER COLUMN cycle_end   SET NOT NULL;
