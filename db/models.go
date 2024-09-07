package db

import (
	"context"

	"github.com/abibby/nulls"
	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/model/mixins"
)

//go:generate spice generate:migration
type Item struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	ID             int        `db:"id,autoincrement,primary" json:"id"`
	UserID         int        `db:"user_id"                  json:"user_id"`
	Name           string     `db:"name"                     json:"name"`
	Description    string     `db:"description"              json:"description"`
	URL            string     `db:"url"                      json:"url"`
	ThinkingCount  *nulls.Int `db:"thinking_count,readonly"  json:"thinking_count,omitempty"`
	PurchasedCount *nulls.Int `db:"purchased_count,readonly" json:"purchased_count,omitempty"`
}

func ItemQuery(ctx context.Context) *builder.ModelBuilder[*Item] {
	return builder.From[*Item]().WithContext(ctx)
}

//go:generate spice generate:migration
type UserItem struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	UserID     int    `db:"user_id,primary"       json:"-"`
	ItemID     int    `db:"item_id,primary"       json:"item_id"`
	Type       string `db:"type"                  json:"type"`
	ItemUserID int    `db:"item_user_id,readonly" json:"item_user_id"`
}

func UserItemQuery(ctx context.Context) *builder.ModelBuilder[*UserItem] {
	return builder.From[*UserItem]().WithContext(ctx)
}

//go:generate spice generate:migration
type Friend struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	UserID         int    `db:"user_id,primary"          json:"-"`
	FriendID       int    `db:"friend_id,primary"        json:"friend_id"`
	FriendName     string `db:"friend_name,readonly"     json:"friend_name"`
	FriendUsername string `db:"friend_username,readonly" json:"friend_username"`
}

func FriendQuery(ctx context.Context) *builder.ModelBuilder[*Friend] {
	return builder.From[*Friend]().WithContext(ctx)
}
