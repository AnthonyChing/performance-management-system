-- Allow Hibernate AttributeConverter (which binds enum values as varchar/character varying)
-- to write to PostgreSQL custom enum columns without explicit casting.
CREATE CAST (character varying AS employment_status_enum) WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS identity_provider_enum)  WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS cycle_type_enum)         WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS cycle_status_enum)       WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS goal_type_enum)          WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS goal_status_enum)        WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS goal_review_decision_enum) WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS review_status_enum)      WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS rating_scale_enum)       WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS appeal_assignee_enum)    WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS appeal_status_enum)      WITH INOUT AS IMPLICIT;
