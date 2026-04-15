package migrations

import (
	"context"

	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/schema"
	"github.com/abibby/wishist/db"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20260413_125935-add_order",
		Up: schema.Run(func(ctx context.Context, tx database.DB) error {
			return db.UserQuery(ctx).Each(tx, func(u *db.User) error {
				items, err := db.ItemQuery(ctx).Where("user_id", "=", u.ID).Get(tx)
				if err != nil {
					return err
				}

				for i, item := range items {
					item.Order = i
					err = model.SaveContext(ctx, tx, item)
					if err != nil {
						return err
					}
				}

				return nil
			})
		}),
		Down: schema.Run(func(ctx context.Context, tx database.DB) error {
			return nil
		}),
	})
}
