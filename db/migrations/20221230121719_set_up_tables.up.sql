CREATE TABLE users (
	"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"username" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"password" TEXT NOT NULL,
	CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE TABLE items (
	"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"user_id" INTEGER NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT NOT NULL,
	"url" TEXT NOT NULL
);

CREATE TABLE user_items (
	"user_id" INTEGER NOT NULL,
	"item_id" INTEGER NOT NULL,
	"type" INTEGER NOT NULL,
	CONSTRAINT user_items_PK PRIMARY KEY (user_id,item_id)
);
