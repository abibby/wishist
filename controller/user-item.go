package controller

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListUserItemsRequest struct {
	User    string `query:"user" validate:"required"`
	Request *http.Request
}
type ListUserItemsResponse []*db.UserItem

var UserItemList = request.Handler(func(r *ListUserItemsRequest) (any, error) {
	items := []*db.UserItem{}
	errNoUsers := fmt.Errorf("Not Found")
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		u := &db.User{}
		err := tx.Get(u, "select * from users where username=?", r.User)
		if errors.Is(err, sql.ErrNoRows) {
			return errNoUsers
		} else if err != nil {
			return err
		}
		return tx.Select(
			&items,
			`select
				user_items.*
			from user_items
			join items on user_items.item_id=items.id
			where
				user_items.user_id = ?
				and items.user_id`,
			uid, u.ID,
		)
	})
	if err == errNoUsers {
		return nil, request.NewHTTPError(err, 404)
	} else if err != nil {
		return nil, err
	}
	return ListUserItemsResponse(items), nil
})

type UserItemCreateRequest struct {
	ItemID  int    `json:"item_id" validate:"required"`
	Type    string `json:"type"    validate:"required|in:thinking,purchased"`
	Request *http.Request
}
type UserItemCreateResponse *db.UserItem

var UserItemCreate = request.Handler(func(r *UserItemCreateRequest) (any, error) {
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("INSERT INTO user_items (user_id,item_id,type) VALUES (?, ?, ?)", uid, r.ItemID, r.Type)
		return err
	})
	if err != nil {
		return nil, err
	}
	return UserItemCreateResponse(&db.UserItem{
		UserID: uid,
		ItemID: r.ItemID,
		Type:   r.Type,
	}), nil
})

type EditUserItemRequest struct {
	ItemID  int    `json:"item_id" validate:"required"`
	Type    string `json:"type"    validate:"required|in:thinking,purchased"`
	Request *http.Request
}
type EditUserItemResponse *db.UserItem

var UserItemUpdate = request.Handler(func(r *EditUserItemRequest) (any, error) {
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("UPDATE user_items SET type=? WHERE user_id=? and item_id=?", r.Type, uid, r.ItemID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return EditUserItemResponse(&db.UserItem{
		UserID: uid,
		ItemID: r.ItemID,
		Type:   r.Type,
	}), nil
})

type RemoveUserItemRequest struct {
	ItemID  int `json:"item_id" validate:"required"`
	Request *http.Request
}
type RemoveUserItemResponse struct {
	Success bool `json:"success"`
}

var UserItemDelete = request.Handler(func(r *RemoveUserItemRequest) (any, error) {
	uid, ok := userID(r.Request.Context())
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM user_items WHERE user_id=? AND item_id=?", uid, r.ItemID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveUserItemResponse{
		Success: true,
	}, nil
})
