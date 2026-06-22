package controller

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/model/mixins"
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListFriendsRequest struct {
	Request *http.Request `inject:""`
}
type UserFriend struct {
	db.Friend
	db.User

	FriendLastUpdated *time.Time `db:"last_updated,readonly" json:"last_updated"`
}
type ListFriendsResponse []*UserFriend

var FriendList = request.Handler(func(r *ListFriendsRequest) (any, error) {
	friends := []*UserFriend{}
	uid := mustUserID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		return builder.NewBuilder().
			From("friends").
			WithContext(r.Request.Context()).
			Select("friends.*", "users.*").
			AddSelectSubquery(
				db.ItemQuery(r.Request.Context()).
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

	Request *http.Request `inject:""`
}
type AddFriendResponse *UserFriend

var FriendCreate = request.Handler(func(r *AddFriendRequest) (any, error) {
	uid := mustUserID(r.Request.Context())

	friend := &db.User{}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		err := tx.Get(friend, "select * from users where id=?", r.FriendID)
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
	FriendID int           `json:"friend_id" validate:"required"`
	Request  *http.Request `inject:""`
}
type RemoveFriendResponse struct {
	Success bool `json:"success"`
}

var FriendDelete = request.Handler(func(r *RemoveFriendRequest) (any, error) {
	uid := mustUserID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
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
