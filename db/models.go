package db

import "github.com/abibby/nulls"

type User struct {
	ID       int    `db:"id"       json:"id"`
	Name     string `db:"name"     json:"name"`
	Username string `db:"username" json:"username"`
	Email    string `db:"email"    json:"email"`
	Verified string `db:"verified" json:"verified"`
	Password []byte `db:"password" json:"-"`
}

type Item struct {
	ID             int        `db:"id"              json:"id"`
	UserID         int        `db:"user_id"         json:"user_id"`
	Name           string     `db:"name"            json:"name"`
	Description    string     `db:"description"     json:"description"`
	URL            string     `db:"url"             json:"url"`
	ThinkingCount  *nulls.Int `db:"thinking_count"  json:"thinking_count,omitempty"`
	PurchasedCount *nulls.Int `db:"purchased_count" json:"purchased_count,omitempty"`
}

type UserItem struct {
	UserID int    `db:"user_id" json:"user_id"`
	ItemID int    `db:"item_id" json:"item_id"`
	Type   string `db:"type"    json:"type"`
}

type Friend struct {
	UserID         int    `db:"user_id"         json:"user_id"`
	FriendID       int    `db:"friend_id"       json:"friend_id"`
	FriendName     string `db:"friend_name"     json:"friend_name"`
	FriendUsername string `db:"friend_username" json:"friend_username"`
}
