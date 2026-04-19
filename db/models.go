package db

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/abibby/nulls"
	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/model/mixins"
	"github.com/abibby/wishist/services/retail"
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
	Price          *nulls.Int `db:"price"                    json:"price"`
	Order          int        `db:"order"                    json:"order"`
	ThinkingCount  *nulls.Int `db:"thinking_count,readonly"  json:"thinking_count,omitempty"`
	PurchasedCount *nulls.Int `db:"purchased_count,readonly" json:"purchased_count,omitempty"`

	oldOrder int
	oldURL   string
}

func ItemQuery(ctx context.Context) *builder.ModelBuilder[*Item] {
	return builder.From[*Item]().WithContext(ctx)
}

func (i *Item) UpdateFromURL(ctx context.Context) error {
	if i.URL == "" || i.URL == i.oldURL {
		return nil
	}

	p, err := retail.Fetch(ctx, i.URL)
	if err != nil {
		return fmt.Errorf("update item price: %w", err)
	}

	if p.Price != 0 && i.Price == nil {
		i.Price = nulls.NewInt(p.Price)
	}

	if p.Title != "" && i.Name == "" {
		i.Name = p.Title
	}

	return nil
}

func (i *Item) AfterLoad(ctx context.Context, tx database.DB) error {
	i.oldOrder = i.Order
	i.oldURL = i.URL
	return nil
}
func (i *Item) AfterSave(ctx context.Context, tx database.DB) error {
	if i.Order != i.oldOrder {
		err := ReconcileItemOrder(ctx, tx, i.UserID)
		if err != nil {
			return err
		}
	}
	i.oldOrder = i.Order
	i.oldURL = i.URL
	return nil
}
func (i *Item) AfterDelete(ctx context.Context, tx database.DB) error {
	return ReconcileItemOrder(ctx, tx, i.UserID)
}

func ReconcileItemOrder(ctx context.Context, tx database.DB, userID int) error {
	slog.Info("test")
	_, err := tx.ExecContext(ctx, `UPDATE items
SET "order" = NewOrder.row_num
FROM (
    SELECT 
        id, 
        (ROW_NUMBER() OVER (ORDER BY "order" ASC, id ASC)) - 1 as row_num
    FROM items
    WHERE user_id = ?
		AND deleted_at is null
) AS NewOrder
WHERE items.id = NewOrder.id
	AND items.user_id = ?
	AND deleted_at is null;`, userID, userID)
	return err
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
