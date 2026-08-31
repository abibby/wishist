package controller

import (
	"context"
	"fmt"
	"net/http"

	"abibby.com/salusa/database"
	"abibby.com/salusa/database/model"
	"abibby.com/salusa/request"
	"github.com/abibby/wishist/db"
	"github.com/jmoiron/sqlx"
)

type ListUserItemsRequest struct {
	Username string `query:"item_username"`
	ItemID   int    `query:"item_id"`

	Read database.Read   `inject:""`
	Ctx  context.Context `inject:""`
}
type ListUserItemsResponse []*db.UserItem

var UserItemList = request.Handler(func(r *ListUserItemsRequest) (any, error) {
	userItems := []*db.UserItem{}

	uid := mustUserID(r.Ctx)
	if r.Username == "" && r.ItemID == 0 {
		return nil, request.NewHTTPError(fmt.Errorf("must have user or item_id"), 422)
	}

	err := r.Read(func(tx *sqlx.Tx) error {
		u, err := db.UserQuery(r.Ctx).Where("username", "=", r.Username).First(tx)
		if err != nil {
			return err
		}

		if u != nil && u.ID == uid {
			return nil
		}

		q := db.UserItemQuery(r.Ctx).
			Select("user_items.*").
			Join("items", "user_items.item_id", "=", "items.id").
			Where("user_items.user_id", "=", uid).
			Where("items.user_id", "!=", uid)

		if u != nil {
			q = q.Where("items.user_id", "=", u.ID)
		}
		if r.ItemID != 0 {
			q = q.Where("item_id", "=", r.ItemID)
		}

		ui, err := q.Get(tx)
		if err != nil {
			return err
		}
		userItems = ui
		return nil
	})
	if err != nil {
		return nil, err
	}

	return ListUserItemsResponse(userItems), nil
})

type UserItemCreateRequest struct {
	ItemID int    `json:"item_id" validate:"required"`
	Type   string `json:"type"    validate:"required|in:thinking,purchased"`

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type UserItemCreateResponse *db.UserItem

var UserItemCreate = request.Handler(func(r *UserItemCreateRequest) (any, error) {
	uid := mustUserID(r.Ctx)

	userItem := &db.UserItem{
		UserID: uid,
		ItemID: r.ItemID,
		Type:   r.Type,
	}
	err := r.Update(func(tx *sqlx.Tx) error {
		item, err := db.ItemQuery(r.Ctx).Find(tx, r.ItemID)
		if err != nil {
			return err
		}

		if item == nil {
			return request.NewHTTPError(fmt.Errorf("no item"), http.StatusUnprocessableEntity)
		}

		return model.SaveContext(r.Ctx, tx, userItem)
	})
	if err != nil {
		return nil, err
	}
	return UserItemCreateResponse(userItem), nil
})

type EditUserItemRequest struct {
	ItemID int    `json:"item_id" validate:"required"`
	Type   string `json:"type"    validate:"required|in:thinking,purchased"`

	Update database.Update `inject:""`
	Ctx    context.Context `inject:""`
}
type EditUserItemResponse *db.UserItem

var UserItemUpdate = request.Handler(func(r *EditUserItemRequest) (any, error) {
	uid := mustUserID(r.Ctx)

	var userItem *db.UserItem
	err := r.Update(func(tx *sqlx.Tx) error {
		item, err := db.ItemQuery(r.Ctx).Find(tx, r.ItemID)
		if err != nil {
			return err
		}

		if item == nil {
			return request.NewHTTPError(fmt.Errorf("no item"), http.StatusUnprocessableEntity)
		}

		userItem, err = db.UserItemQuery(r.Ctx).
			Where("item_id", "=", r.ItemID).
			Where("user_id", "=", uid).
			First(tx)
		if err != nil {
			return err
		}

		if userItem == nil {
			return request.NewHTTPError(fmt.Errorf("no user item"), http.StatusUnprocessableEntity)
		}

		userItem.Type = r.Type
		// userItem.ItemUserID = item.UserID

		return model.SaveContext(r.Ctx, tx, userItem)
	})
	if err != nil {
		return nil, err
	}
	return EditUserItemResponse(userItem), nil
})

type RemoveUserItemRequest struct {
	ItemID int `json:"item_id" validate:"required"`

	Ctx    context.Context `inject:""`
	Update database.Update `inject:""`
}
type RemoveUserItemResponse struct {
	Success bool `json:"success"`
}

var UserItemDelete = request.Handler(func(r *RemoveUserItemRequest) (any, error) {
	uid := mustUserID(r.Ctx)
	err := r.Update(func(tx *sqlx.Tx) error {
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
