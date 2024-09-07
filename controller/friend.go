package controller

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListFriendsRequest struct {
	Request *http.Request `inject:""`
}
type ListFriendsResponse []*db.Friend

var FriendList = request.Handler(func(r *ListFriendsRequest) (any, error) {
	friends := []*db.Friend{}
	uid := mustUserID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		return tx.Select(
			&friends,
			`select
				friends.*,
				users.name as friend_name,
				users.username as friend_username
			from friends
			join users on friends.friend_id=users.id
			where user_id=?`,
			uid,
		)
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
type AddFriendResponse *db.Friend

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
	return AddFriendResponse(&db.Friend{
		UserID:         uid,
		FriendID:       friend.ID,
		FriendName:     friend.Name,
		FriendUsername: friend.Username,
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
