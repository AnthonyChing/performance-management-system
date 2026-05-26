-- Make self-eval date columns optional so cycles can skip the self-eval phase
ALTER TABLE performance_cycles
  ALTER COLUMN self_eval_start DROP NOT NULL,
  ALTER COLUMN self_eval_end   DROP NOT NULL;
