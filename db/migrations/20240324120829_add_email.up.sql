ALTER TABLE users
    ADD email TEXT DEFAULT "" NOT NULL;
ALTER TABLE users
    ADD lookup TEXT DEFAULT "" NOT NULL;
ALTER TABLE users
    ADD verified BOOLEAN DEFAULT false NOT NULL;