package controller

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/abibby/nulls"
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListItemsRequest struct {
	User    string `query:"user" validate:"required"`
	Request *http.Request
}
type ListItemsResponse []*db.Item

var ItemList = request.Handler(func(r *ListItemsRequest) (ListItemsResponse, error) {
	items := []*db.Item{}
	uid, ok := userID(r.Request.Context())

	errNoUsers := fmt.Errorf("Not Found")
	err := db.Tx(r.Request.Context(), func(tx *sqlx.Tx) error {
		u := &db.User{}
		err := tx.Get(u, "select * from users where username=?", r.User)
		if errors.Is(err, sql.ErrNoRows) {
			return errNoUsers
		} else if err != nil {
			return err
		}
		query := "select * from items where user_id = ? order by user_order"
		args := []any{u.ID}
		if uid != u.ID && ok {
			query = `select 
				items.*,
				(select count(*) from user_items where item_id=items.id and user_items.user_id!=? and type='thinking') as thinking_count,
				(select count(*) from user_items where item_id=items.id and user_items.user_id!=? and type='purchased') as purchased_count
			from items
			where user_id = ?
			order by user_order`
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
		order := nulls.NewInt(0)
		err := tx.Get(&order, "select max(user_order) from items where user_id=?", uid)
		if err != nil {
			return err
		}
		_, err = tx.Exec("INSERT INTO items (user_id,name,description,url,user_order) VALUES (?, ?, ?, ?, ?)", uid, r.Name, r.Description, r.URL, order.Value()+1)
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

var ItemUpdate = request.Handler(func(r *EditItemRequest) (EditItemResponse, error) {
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

var ItemDelete = request.Handler(func(r *RemoveItemRequest) (*RemoveItemResponse, error) {
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

type ItemMoveRequest struct {
	ItemID            int `json:"item_id"`
	DestinationItemID int `json:"destination_item_id"`
	Ctx               context.Context
}
type ItemMoveResponse struct {
	Success bool `json:"success"`
}

var ItemMove = request.Handler(func(r *ItemMoveRequest) (*ItemMoveResponse, error) {
	item := &db.Item{}
	destItem := &db.Item{}
	uid, ok := userID(r.Ctx)
	if !ok {
		return nil, fmt.Errorf("user not logged in")
	}
	err := db.Tx(r.Ctx, func(tx *sqlx.Tx) error {
		err := tx.Get(destItem, "SELECT * FROM items WHERE id=?", r.DestinationItemID)
		if err != nil {
			return err
		}
		err = tx.Get(item, "SELECT * FROM items WHERE id=?", r.ItemID)
		if err != nil {
			return err
		}

		// return fmt.Errorf(`dst %d item %d`, destItem.Order, item.Order)

		if destItem.Order > item.Order {
			_, err = tx.Exec(`UPDATE items 
				SET user_order=user_order-1 
				WHERE user_order <= ? 
					AND user_order > ?
					AND user_id = ?`, destItem.Order, item.Order, uid)
			if err != nil {
				return err
			}
		} else {
			_, err = tx.Exec(`UPDATE items 
				SET user_order=user_order+1 
				WHERE user_order >= ?
					AND user_order < ?
					AND user_id = ?`, destItem.Order, item.Order, uid)
			if err != nil {
				return err
			}
		}
		_, err = tx.Exec("UPDATE items SET user_order=? WHERE id=?", destItem.Order, item.ID)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}
	return &ItemMoveResponse{
		Success: true,
	}, nil
})
