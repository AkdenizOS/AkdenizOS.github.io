CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  work TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  notice_version TEXT NOT NULL,
  mail_status TEXT NOT NULL DEFAULT 'pending' CHECK(mail_status IN ('pending', 'sent', 'failed')),
  mail_attempts INTEGER NOT NULL DEFAULT 0 CHECK(mail_attempts BETWEEN 0 AND 6),
  mail_next_at INTEGER NOT NULL,
  mail_lease_until INTEGER NOT NULL DEFAULT 0,
  mail_sent_at INTEGER,
  CHECK ((mail_status = 'sent') = (mail_sent_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS applications_mail_due ON applications(mail_status, mail_next_at);
