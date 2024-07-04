package db

import (
	"context"

	"github.com/abibby/wishist/db/migrations"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
)

func Migrate(ctx context.Context) error {
	return migrations.Use().Up(ctx, db)
}
