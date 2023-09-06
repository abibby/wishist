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
	Request *http.Request
}
type ListFriendsResponse []*db.Friend

var FriendList = request.Handler(func(r *ListFriendsRequest) (any, error) {
	friends := []*db.Friend{}
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
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
	FriendUsername string `json:"username" validate:"required"`
	Request        *http.Request
}
type AddFriendResponse *db.Friend

var FriendCreate = request.Handler(func(r *AddFriendRequest) (any, error) {
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	errFriendNotFound := fmt.Errorf("friend not found")
	friend := &db.User{}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		err := tx.Get(friend, "select * from users where username=?", r.FriendUsername)
		if err == sql.ErrNoRows {
			return errFriendNotFound
		} else if err != nil {
			return err
		}
		_, err = tx.Exec("INSERT INTO friends (user_id,friend_id) VALUES (?, ?)", uid, friend.ID)
		return err
	})
	if err == errFriendNotFound {
		return nil, request.NewHTTPError(err, 422)
	} else if err != nil {
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
	FriendUsername string `json:"username" validate:"required"`
	Request        *http.Request
}
type RemoveFriendResponse struct {
	Success bool `json:"success"`
}

var FriendDelete = request.Handler(func(r *RemoveFriendRequest) (any, error) {
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM friends WHERE user_id=? AND friend_id=(select id from users where username=?)", uid, r.FriendUsername)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveFriendResponse{
		Success: true,
	}, nil
})
