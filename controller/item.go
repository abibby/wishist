package controller

import (
	"net/http"

	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/db"
	"github.com/jmoiron/sqlx"
)

type ListItemsRequest struct {
	UserID  int `query:"user_id"`
	Request http.Request
}
type ListItemsResponse []*db.Item

var ListItems = handler.Handler(func(r *ListItemsRequest) (any, error) {
	items := []*db.Item{}
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		return tx.Select(&items, "select * from items where user_id = ?", r.UserID)
	})
	if err != nil {
		return nil, err
	}
	return ListItemsResponse(items), nil
})

type AddItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Request     http.Request
}
type AddItemResponse *db.Item

var AddItem = handler.Handler(func(r *AddItemRequest) (any, error) {
	item := &db.Item{}
	userID := 1
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("INSERT INTO items (user_id,name,description,url) VALUES (?, ?, ?, ?)", userID, r.Name, r.Description, r.URL)
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
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Request     http.Request
}
type EditItemResponse *db.Item

var EditItem = handler.Handler(func(r *EditItemRequest) (any, error) {
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
	ItemID  int `json:"item_id"`
	Request http.Request
}
type RemoveItemResponse struct {
	Success bool `json:"success"`
}

var RemoveItem = handler.Handler(func(r *RemoveItemRequest) (any, error) {
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM items WHERE id=?", r.ItemID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &RemoveItemResponse{
		Success: true,
	}, nil
})
