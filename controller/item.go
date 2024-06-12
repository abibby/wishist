package controller

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListItemsRequest struct {
	User    string `query:"user" validate:"required"`
	Request *http.Request
}
type ListItemsResponse []*db.Item

var ItemList = request.Handler(func(r *ListItemsRequest) (any, error) {
	items := []*db.Item{}
	uid, ok := userID(r.Request.Context())

	errNoUsers := fmt.Errorf(http.StatusText(http.StatusNotFound))
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		u := &db.User{}
		err := tx.Get(u, "select * from users where username=?", r.User)
		if errors.Is(err, sql.ErrNoRows) {
			return errNoUsers
		} else if err != nil {
			return err
		}
		query := "select * from items where user_id = ?"
		args := []any{u.ID}
		if uid != u.ID && ok {
			query = `select 
				items.*,
				(select count(*) from user_items where item_id=items.id and user_items.user_id!=? and type='thinking') as thinking_count,
				(select count(*) from user_items where item_id=items.id and user_items.user_id!=? and type='purchased') as purchased_count
			from items
			where user_id = ?`
			args = []any{uid, uid, u.ID}
		}

		return tx.Select(&items, query, args...)
	})
	if err == errNoUsers {
		return nil, request.NewHTTPError(err, 404)
	} else if err != nil {
		return nil, err
	}
	return ListItemsResponse(items), nil
})

type AddItemRequest struct {
	Name        string          `json:"name"        validate:"required"`
	Description string          `json:"description" validate:""`
	URL         string          `json:"url"         validate:""`
	Ctx         context.Context `inject:""`
}
type AddItemResponse *db.Item

var ItemCreate = request.Handler(func(r *AddItemRequest) (AddItemResponse, error) {
	item := &db.Item{}
	uid, ok := userID(r.Ctx)
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Ctx, func(tx *sqlx.Tx) error {
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
	Description string `json:"description" validate:""`
	URL         string `json:"url"         validate:""`
	Request     *http.Request
}
type EditItemResponse *db.Item

var ItemUpdate = request.Handler(func(r *EditItemRequest) (any, error) {
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

var ItemDelete = request.Handler(func(r *RemoveItemRequest) (any, error) {
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
