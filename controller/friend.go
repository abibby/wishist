package controller

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/db"
	"github.com/jmoiron/sqlx"
)

type ListFriendsRequest struct {
	Request *http.Request
}
type ListFriendsResponse []*db.Friend

var FriendList = handler.Handler(func(r *ListFriendsRequest) (any, error) {
	friends := []*db.Friend{}
	uid := userID(r.Request.Context())
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
	Request  *http.Request
}
type AddFriendResponse *db.Friend

var FriendCreate = handler.Handler(func(r *AddFriendRequest) (any, error) {
	uid := userID(r.Request.Context())
	errFriendNotFound := fmt.Errorf("friend not found")
	friend := &db.User{}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		err := tx.Get(friend, "select * from users where id=?", r.FriendID)
		if err == sql.ErrNoRows {
			return errFriendNotFound
		} else if err != nil {
			return err
		}
		_, err = tx.Exec("INSERT INTO friends (user_id,friend_id) VALUES (?, ?)", uid, r.FriendID)
		return err
	})
	if err == errFriendNotFound {
		return handler.ErrorResponse(err, 422), nil
	} else if err != nil {
		return nil, err
	}
	return AddFriendResponse(&db.Friend{
		UserID:         uid,
		FriendID:       r.FriendID,
		FriendName:     friend.Name,
		FriendUsername: friend.Name,
	}), nil
})

type RemoveFriendRequest struct {
	FriendID int `json:"friend_id" validate:"required"`
	Request  *http.Request
}
type RemoveFriendResponse struct {
	Success bool `json:"success"`
}

var FriendDelete = handler.Handler(func(r *RemoveFriendRequest) (any, error) {
	uid := userID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM items WHERE user_id=? AND friend_id=?", uid, r.FriendID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveFriendResponse{
		Success: true,
	}, nil
})
