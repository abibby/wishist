//go:build test

package controller

import (
	"context"
	"net/http"

	"github.com/abibby/salusa/database/databasedi"
	"github.com/abibby/salusa/di"
	"github.com/abibby/wishist/db"
	"github.com/abibby/wishist/db/migrations"
	"github.com/jmoiron/sqlx"
)

func TestResetDatabase(w http.ResponseWriter, r *http.Request) {
	db.DBMtx.Lock()
	defer db.DBMtx.Unlock()

	ctx := context.WithoutCancel(r.Context())

	database, err := di.Resolve[*sqlx.DB](ctx)
	if err != nil {
		panic(err)
	}

	err = database.Close()
	if err != nil {
		panic(err)
	}

	err = databasedi.RegisterFromConfig(migrations.Use())(ctx)
	if err != nil {
		panic(err)
	}
	err = databasedi.RegisterTransactions(db.DBMtx)(ctx)
	if err != nil {
		panic(err)
	}

	w.WriteHeader(http.StatusNoContent)
}
