//go:build test

package migrations

import (
	"context"
	"fmt"

	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/migrate"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/schema"
	"github.com/abibby/wishist/db"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	migrations.Add(&migrate.Migration{
		Name: "20240705_092723-insert-test-users",
		Up: schema.Run(func(ctx context.Context, tx database.DB) error {
			for i := 0; i < 30; i++ {
				u := &db.User{
					Name:     fmt.Sprintf("User %d Name", i),
					Username: fmt.Sprintf("user%d", i),
					Email:    fmt.Sprintf("user%d@example.com", i),
					Password: []byte{},
					Verified: true,
				}

				err := model.SaveContext(ctx, tx, u)
				if err != nil {
					return err
				}

				hash, err := bcrypt.GenerateFromPassword(
					u.SaltedPassword(fmt.Sprintf("pass%d", i)),
					bcrypt.DefaultCost,
				)
				if err != nil {
					return err
				}

				u.SetPasswordHash(hash)

				err = model.SaveContext(ctx, tx, u)
				if err != nil {
					return err
				}
			}
			return nil
		}),
		Down: schema.Run(func(ctx context.Context, tx database.DB) error {
			return nil
		}),
	})
}
