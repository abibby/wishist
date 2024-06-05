package controller

import (
	"context"

	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type GetCurrentUserRequest struct {
	User *db.User `inject:""`
}
type GetCurrentUserResponse db.User

var GetCurrentUser = request.Handler(func(r *GetCurrentUserRequest) (*GetCurrentUserResponse, error) {
	return (*GetCurrentUserResponse)(r.User), nil
})

type GetUserRequest struct {
	Username string          `path:"username"`
	Ctx      context.Context `inject:""`
}
type GetUserResponse db.User

var GetUser = request.Handler(func(r *GetUserRequest) (*GetUserResponse, error) {
	var u *db.User
	var err error
	err = db.Tx(r.Ctx, func(tx *sqlx.Tx) error {
		u, err = builder.From[*db.User]().Where("username", "=", r.Username).First(tx)
		return err
	})
	if err != nil {
		return nil, err
	}
	return (*GetUserResponse)(u), nil
})
