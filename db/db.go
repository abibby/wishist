package db

import (
	"context"
	"database/sql"
	"sync"

	"github.com/abibby/salusa/di"
	"github.com/jmoiron/sqlx"
	// _ "modernc.org/sqlite"
)

var db *sqlx.DB
var dbMtx = &sync.Mutex{}

func Open(ctx context.Context) error {
	var err error
	db, err = di.Resolve[*sqlx.DB](ctx)
	if err != nil {
		return err
	}
	return nil
}

func Tx(ctx context.Context, cb func(tx *sqlx.Tx) error) error {
	dbMtx.Lock()
	defer dbMtx.Unlock()

	tx, err := db.BeginTxx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}

	err = cb(tx)
	if err != nil {
		rollbackErr := tx.Rollback()
		if rollbackErr != nil {
			return rollbackErr
		}

		return err
	}

	return tx.Commit()
}
