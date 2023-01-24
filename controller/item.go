package controller

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/db"
	"github.com/jmoiron/sqlx"
)

type ListItemsRequest struct {
	User    string `query:"user" validate:"required"`
	Request *http.Request
}
type ListItemsResponse []*db.Item

var ItemList = handler.Handler(func(r *ListItemsRequest) (any, error) {
	items := []*db.Item{}
	errNoUsers := fmt.Errorf("Not Found")
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		u := &db.User{}
		err := tx.Get(u, "select * from users where username=?", r.User)
		if errors.Is(err, sql.ErrNoRows) {
			return errNoUsers
		} else if err != nil {
			return err
		}
		return tx.Select(&items, "select * from items where user_id = ?", u.ID)
	})
	if err == errNoUsers {
		return handler.ErrorResponse(err, 404), nil
	} else if err != nil {
		return nil, err
	}
	return ListItemsResponse(items), nil
})

type AddItemRequest struct {
	Name        string `json:"name"        validate:"required"`
	Description string `json:"description" validate:"required"`
	URL         string `json:"url"         validate:"required|url"`
	Request     *http.Request
}
type AddItemResponse *db.Item

var ItemCreate = handler.Handler(func(r *AddItemRequest) (any, error) {
	item := &db.Item{}
	uid := userID(r.Request.Context())
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("INSERT INTO items (user_id,name,description,url) VALUES (?, ?, ?, ?)", uid, r.Name, r.Description, r.URL)
		if err != nil {
			return err
		}
		return tx.Get(item, "select * from items order by id desc limit 1")
	})
	if err != nil {
		return nil, err
	}
	return AddItemResponse(item), nil
})

type EditItemRequest struct {
	ID          int    `json:"id"          validate:"required"`
	Name        string `json:"name"        validate:"required"`
	Description string `json:"description" validate:"required"`
	URL         string `json:"url"         validate:"required|url"`
	Request     http.Request
}
type EditItemResponse *db.Item

var ItemUpdate = handler.Handler(func(r *EditItemRequest) (any, error) {
	item := &db.Item{}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("UPDATE items SET name=?, description=?, url=? WHERE id=?", r.Name, r.Description, r.URL, r.ID)
		if err != nil {
			return err
		}
		return tx.Get(item, "select * from items where id=? limit 1", r.ID)
	})
	if err != nil {
		return nil, err
	}
	return EditItemResponse(item), nil
})

type RemoveItemRequest struct {
	ID      int `json:"id" validate:"required"`
	Request *http.Request
}
type RemoveItemResponse struct {
	Success bool `json:"success"`
}

var ItemDelete = handler.Handler(func(r *RemoveItemRequest) (any, error) {
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM items WHERE id=?", r.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveItemResponse{
		Success: true,
	}, nil
})
