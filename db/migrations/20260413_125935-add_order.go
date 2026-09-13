package migrations

import (
	"context"

	"abibby.com/wishist/db"
	"gosalusa.com/database"
	"gosalusa.com/database/migrate"
	"gosalusa.com/database/schema"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20260413_125935-add_order",
		Up: schema.Run(func(ctx context.Context, tx database.DB) error {
			return db.UserQuery(ctx).Each(tx, func(u *db.User) error {
				return db.ReconcileItemOrder(ctx, tx, u.ID)
			})
		}),
		Down: schema.Run(func(ctx context.Context, tx database.DB) error {
			return nil
		}),
	})
}
