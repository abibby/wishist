package controller

import (
	"context"
	"fmt"
	"net/http"

	"abibby.com/salusa/database"
	"abibby.com/salusa/database/model"
	"abibby.com/salusa/database/model/mixins"
	"abibby.com/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type GetCurrentUserRequest struct {
	User *db.User `inject:""`
}

type GetCurrentUserResponse struct {
	mixins.Timestamps
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

var GetCurrentUser = request.Handler(func(r *GetCurrentUserRequest) (*GetCurrentUserResponse, error) {
	return &GetCurrentUserResponse{
		ID:        r.User.ID,
		Name:      r.User.Name,
		Username:  r.User.Username,
		Email:     r.User.Email,
		AvatarURL: r.User.AvatarURL,
	}, nil
})

type UserListRequest struct {
	Username string `query:"username" validate:"required"`

	Read database.Read   `inject:""`
	Ctx  context.Context `inject:""`
}
type UserListResponse []*db.User

var UserList = request.Handler(func(r *UserListRequest) (UserListResponse, error) {
	var users []*db.User
	var err error
	database.Value(r.Read, func(tx *sqlx.Tx) ([]*db.User, error) {
		return db.UserQuery(r.Ctx).Where("username", "=", r.Username).Get(tx)
	})
	if err != nil {
		return nil, err
	}

	return UserListResponse(users), nil
})

type UserUpdateRequest struct {
	ID   int    `json:"id"   validate:"required"`
	Name string `json:"name" validate:"required"`

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type UserUpdateResponse *db.User

var UserUpdate = request.Handler(func(r *UserUpdateRequest) (UserUpdateResponse, error) {
	var user *db.User
	var err error

	uid := mustUserID(r.Ctx)

	if uid != r.ID {
		return nil, request.NewHTTPError(fmt.Errorf(http.StatusText(403)), 403)
	}

	err = r.Update(func(tx *sqlx.Tx) error {
		user, err = db.UserQuery(r.Ctx).Find(tx, r.ID)
		if err != nil {
			return err
		}

		user.Name = r.Name

		return model.SaveContext(r.Ctx, tx, user)
	})
	if err != nil {
		return nil, err
	}

	return UserUpdateResponse(user), nil
})
