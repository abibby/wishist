package controller

import (
	"context"

	"github.com/abibby/salusa/database"
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

type UserListRequest struct {
	Username string `query:"username"`

	Read database.Read   `inject:""`
	Ctx  context.Context `inject:""`
}
type UserListResponse []*db.User

var UserList = request.Handler(func(r *UserListRequest) (UserListResponse, error) {
	var users []*db.User
	var err error
	err = r.Read(func(tx *sqlx.Tx) error {
		users, err = db.UserQuery(r.Ctx).Where("username", "=", r.Username).Get(tx)
		return err
	})
	if err != nil {
		return nil, err
	}

	return UserListResponse(users), nil
})
