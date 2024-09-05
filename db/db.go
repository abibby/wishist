package db

import (
	"context"
	"sync"

	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/di"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

var DBMtx = &sync.Mutex{}

func Tx(ctx context.Context, cb func(tx *sqlx.Tx) error) error {
	update, err := di.Resolve[database.Update](ctx)
	if err != nil {
		return err
	}
	return update(cb)
}
