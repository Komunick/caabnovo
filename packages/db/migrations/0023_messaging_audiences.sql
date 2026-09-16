-- Optional, explicit demographic data; never derive identity or residence from names/OAB.
ALTER TABLE member
 ADD COLUMN category text NOT NULL DEFAULT '' CHECK (length(category)<=80),
 ADD COLUMN gender text NOT NULL DEFAULT '' CHECK (gender IN ('','female','male','nonbinary','other','undisclosed')),
 ADD COLUMN city text NOT NULL DEFAULT '' CHECK (length(city)<=120),
 ADD COLUMN residence_state text NOT NULL DEFAULT '' CHECK (residence_state IN ('','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
CREATE INDEX member_messaging_demographics_idx ON member(administrative_status,residence_state,gender,birth_date) WHERE archived_at IS NULL;
CREATE INDEX member_messaging_category_idx ON member(lower(category)) WHERE archived_at IS NULL;
CREATE INDEX member_messaging_city_idx ON member(lower(city),residence_state) WHERE archived_at IS NULL;
-- Preserve the old request when rescheduling; the replacement is a new immutable snapshot.
ALTER TABLE messaging_execution DROP CONSTRAINT messaging_execution_reason_check;
ALTER TABLE messaging_execution ADD CONSTRAINT messaging_execution_reason_check
 CHECK(reason IN ('NO_CHANNEL','NO_RECIPIENTS','ACCESS_REVOKED','USER_CANCELED','RESCHEDULED'));
CREATE INDEX messaging_execution_calendar_idx ON messaging_execution(status,scheduled_at,id);
