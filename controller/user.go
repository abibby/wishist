package controller

import (
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
)

type GetUserRequest struct {
	User *db.User `inject:""`
}
type GetUserResponse db.User

var GetUser = request.Handler(func(r *GetUserRequest) (*GetUserResponse, error) {
	return (*GetUserResponse)(r.User), nil
})
