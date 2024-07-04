package controller

import (
	"context"
	"fmt"
	"net/http"

	"github.com/abibby/salusa/database"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListItemsRequest struct {
	UserID int `query:"user_id"`
	ID     int `query:"id"`

	Read database.Read   `inject:""`
	Ctx  context.Context `inject:""`
}
type ListItemsResponse []*db.Item

var ItemList = request.Handler(func(r *ListItemsRequest) (any, error) {
	uid, loggedIn := userID(r.Ctx)

	if r.UserID == 0 && r.ID == 0 {
		return nil, request.NewHTTPError(fmt.Errorf("must have user_id or id"), 422)
	}

	var items []*db.Item
	var err error

	err = r.Read(func(tx *sqlx.Tx) error {
		q := db.ItemQuery(r.Ctx)

		if loggedIn && r.UserID != uid {
			userItemQuery := db.UserItemQuery(r.Ctx).
				SelectFunction("count", "*").
				WhereColumn("item_id", "=", "items.id").
				Where("user_items.user_id", "!=", uid)

			q = q.AddSelectSubquery(userItemQuery.Where("type", "=", "thinking"), "thinking_count").
				AddSelectSubquery(userItemQuery.Where("type", "=", "purchased"), "purchased_count")
		}

		if r.UserID != 0 {
			q = q.Where("user_id", "=", r.UserID)
		}
		if r.ID != 0 {
			q = q.Where("id", "=", r.ID)
		}

		items, err = q.Get(tx)
		return err
	})
	if err != nil {
		return nil, err
	}

	return ListItemsResponse(items), nil
})

type AddItemRequest struct {
	Name        string `json:"name"        validate:"required"`
	Description string `json:"description" validate:""`
	URL         string `json:"url"         validate:""`

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type AddItemResponse *db.Item

var ItemCreate = request.Handler(func(r *AddItemRequest) (AddItemResponse, error) {
	item := &db.Item{}
	uid := mustUserID(r.Ctx)

	item.UserID = uid
	item.Name = r.Name
	item.Description = r.Description
	item.URL = r.URL

	err := r.Update(func(tx *sqlx.Tx) error {
		return model.SaveContext(r.Ctx, tx, item)
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

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type EditItemResponse *db.Item

var ItemUpdate = request.Handler(func(r *EditItemRequest) (any, error) {
	var item *db.Item
	var err error

	uid := mustUserID(r.Ctx)

	err = r.Update(func(tx *sqlx.Tx) error {
		item, err = db.ItemQuery(r.Ctx).Find(tx, r.ID)
		if err != nil {
			return err
		}
		if item.UserID != uid {
			return request.NewHTTPError(fmt.Errorf("Unauthorized"), http.StatusUnauthorized)
		}
		item.Name = r.Name
		item.Description = r.Description
		item.URL = r.URL
		return model.SaveContext(r.Ctx, tx, item)
	})
	if err != nil {
		return nil, err
	}
	return EditItemResponse(item), nil
})

type RemoveItemRequest struct {
	ID int `json:"id" validate:"required"`

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type RemoveItemResponse struct {
	Success bool `json:"success"`
}

var ItemDelete = request.Handler(func(r *RemoveItemRequest) (any, error) {

	uid := mustUserID(r.Ctx)

	err := r.Update(func(tx *sqlx.Tx) error {
		return db.ItemQuery(r.Ctx).
			Where("id", "=", r.ID).
			Where("user_id", "=", uid).
			Delete(tx)
	})
	if err != nil {
		return nil, err
	}
	return &RemoveItemResponse{
		Success: true,
	}, nil
})
