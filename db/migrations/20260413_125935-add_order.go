package migrations

import (
	"context"

	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/schema"
	"github.com/abibby/wishist/db"
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
