package controller

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"abibby.com/salusa/database"
	"abibby.com/salusa/database/builder"
	"abibby.com/salusa/database/model/mixins"
	"abibby.com/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListFriendsRequest struct {
	Ctx    context.Context `inject:""`
	Update database.Update `inject:""`
}
type UserFriend struct {
	db.Friend
	db.User

	FriendLastUpdated *time.Time `db:"last_updated,readonly" json:"last_updated"`
}
type ListFriendsResponse []*UserFriend

var FriendList = request.Handler(func(r *ListFriendsRequest) (any, error) {
	friends := []*UserFriend{}
	uid := mustUserID(r.Ctx)
	err := r.Update(func(tx *sqlx.Tx) error {
		return builder.NewBuilder().
			From("friends").
			WithContext(r.Ctx).
			Select("friends.*", "users.*").
			AddSelectSubquery(
				db.ItemQuery(r.Ctx).
					Select("items.updated_at").
					WhereColumn("items.user_id", "=", "friends.friend_id").
					OrderByDesc("items.updated_at").
					WithoutGlobalScope(mixins.SoftDeleteScope).
					Limit(1),
				"last_updated",
			).
			Join("users", "friends.friend_id", "=", "users.id").
			Where("user_id", "=", uid).
			Load(tx, &friends)
	})
	if err != nil {
		return nil, err
	}

	return ListFriendsResponse(friends), nil
})

type AddFriendRequest struct {
	FriendID int `json:"friend_id" validate:"required"`

	Ctx    context.Context `inject:""`
	Update database.Update `inject:""`
}
type AddFriendResponse *UserFriend

var FriendCreate = request.Handler(func(r *AddFriendRequest) (any, error) {
	uid := mustUserID(r.Ctx)

	friend := &db.User{}
	err := r.Update(func(tx *sqlx.Tx) error {
		var err error
		friend, err = db.UserQuery(r.Ctx).Find(tx, r.FriendID)
		if err == sql.ErrNoRows {
			return request.NewHTTPError(fmt.Errorf("friend not found"), 422)
		} else if err != nil {
			return err
		}
		_, err = tx.Exec("INSERT INTO friends (user_id,friend_id) VALUES (?, ?)", uid, friend.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return AddFriendResponse(&UserFriend{
		Friend: db.Friend{
			UserID:   uid,
			FriendID: r.FriendID,
		},
		User: *friend,
	}), nil
})

type RemoveFriendRequest struct {
	FriendID int `json:"friend_id" validate:"required"`

	Ctx    context.Context `inject:""`
	Update database.Update `inject:""`
}
type RemoveFriendResponse struct {
	Success bool `json:"success"`
}

var FriendDelete = request.Handler(func(r *RemoveFriendRequest) (any, error) {
	uid := mustUserID(r.Ctx)
	err := r.Update(func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM friends WHERE user_id=? AND friend_id=?", uid, r.FriendID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveFriendResponse{
		Success: true,
	}, nil
})
