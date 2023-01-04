package db

type User struct {
	ID       int    `db:"id"       json:"id"`
	Name     string `db:"name"     json:"name"`
	Username string `db:"username" json:"username"`
	Password []byte `db:"password" json:"-"`
}

type Item struct {
	ID          int    `db:"id"          json:"id"`
	UserID      int    `db:"user_id"     json:"user_id"`
	Name        string `db:"name"        json:"name"`
	Description string `db:"description" json:"description"`
	URL         string `db:"url"         json:"url"`
}

type UserItem struct {
	UserID int    `db:"user_id" json:"user_id"`
	ItemID int    `db:"item_id" json:"item_id"`
	Type   string `db:"type"    json:"type"`
}
