package controller_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"testing"

	"abibby.com/wishist/controller"
	"abibby.com/wishist/db"
	"abibby.com/wishist/db/migrations"
	"abibby.com/wishist/services/retail"
	"github.com/go-openapi/testify/v2/assert"
	"github.com/go-openapi/testify/v2/require"
	"github.com/golang-jwt/jwt/v4"
	"github.com/jmoiron/sqlx"
	"gosalusa.com/auth"
	"gosalusa.com/database"
	"gosalusa.com/database/dbtest"
	"gosalusa.com/database/model"
	"gosalusa.com/di"
	"gosalusa.com/request"
	"gosalusa.com/testing/handlertest"
)

func newRunner() *dbtest.Runner {
	return dbtest.NewRunner(func() (*sqlx.DB, error) {
		db, err := sqlx.Open("sqlite3", ":memory:")
		if err != nil {
			return nil, err
		}
		db.SetMaxOpenConns(1)
		db.SetMaxIdleConns(1)
		err = migrations.Use().Up(context.Background(), db)
		if err != nil {
			return nil, err
		}
		return db, nil
	})
}

var runner = newRunner()

var (
	setAppKeyOnce sync.Once
	testAppKey    = []byte("wishist-test-app-key")
)

func setAppKey() {
	setAppKeyOnce.Do(func() {
		auth.SetAppKey(testAppKey)
	})
}

func tokenForUser(t *testing.T, uid int) string {
	t.Helper()
	setAppKey()
	claims := auth.NewClaims().WithSubject(fmt.Sprint(uid)).WithScopes(auth.ScopeAccess)
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(testAppKey)
	require.NoError(t, err)
	return signed
}

type env struct {
	t   *testing.T
	tx  *sqlx.Tx
	ctx context.Context
}

func newEnv(t *testing.T, tx *sqlx.Tx) *env {
	ctx := di.TestDependencyProviderContext()
	di.Register(ctx, func(ctx context.Context, tag string) (database.Update, error) {
		return dbtest.Update(tx), nil
	})
	di.Register(ctx, func(ctx context.Context, tag string) (database.Read, error) {
		return dbtest.Read(tx), nil
	})
	di.Register(ctx, func(ctx context.Context, tag string) (retail.Service, error) {
		return stubRetail{}, nil
	})
	return &env{t: t, tx: tx, ctx: ctx}
}

type stubRetail struct{}

func (stubRetail) Fetch(ctx context.Context, uri string) (*retail.Product, error) {
	return nil, fmt.Errorf("stub retail has no provider for %s", uri)
}

func (e *env) do(h http.Handler, method, target, token string, body any) *handlertest.HttpResult {
	rb := handlertest.New(e.ctx, e.t, request.HandleErrors()(auth.AttachUser()(h))).WithJSONHeaders()
	if token != "" {
		rb = rb.WithHeader("Authorization", "Bearer "+token)
	}
	var br io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		require.NoError(e.t, err)
		br = bytes.NewReader(b)
	}
	switch method {
	case http.MethodGet:
		return rb.Get(target)
	case http.MethodPost:
		return rb.Post(target, br)
	case http.MethodPut:
		return rb.Put(target, br)
	case http.MethodDelete:
		return rb.Delete(target, br)
	}
	e.t.Fatalf("unsupported method %q", method)
	return nil
}

func createUser(t *testing.T, tx database.DB, username string) *db.User {
	t.Helper()
	u := &db.User{
		Username: username,
		Email:    fmt.Sprintf("%s@example.com", username),
		Name:     username,
		Password: []byte{},
	}
	require.NoError(t, model.SaveContext(context.Background(), tx, u))
	return u
}

func createItem(t *testing.T, tx database.DB, userID int, name string, order int) *db.Item {
	t.Helper()
	item := &db.Item{
		UserID: userID,
		Name:   name,
		Order:  order,
	}
	require.NoError(t, model.SaveContext(context.Background(), tx, item))
	return item
}

func createUserItem(t *testing.T, tx database.DB, userID, itemID int, typ string) *db.UserItem {
	t.Helper()
	ui := &db.UserItem{UserID: userID, ItemID: itemID, Type: typ}
	require.NoError(t, model.SaveContext(context.Background(), tx, ui))
	return ui
}

func loadItems(t *testing.T, tx database.DB, userID int) []*db.Item {
	t.Helper()
	items, err := db.ItemQuery(context.Background()).Where("user_id", "=", userID).OrderBy("order").Get(tx)
	require.NoError(t, err)
	return items
}

func findItem(t *testing.T, tx database.DB, id int) *db.Item {
	t.Helper()
	item, err := db.ItemQuery(context.Background()).Find(tx, id)
	require.NoError(t, err)
	return item
}

func unmarshalItems(t *testing.T, res *handlertest.HttpResult) []*db.Item {
	t.Helper()
	items := []*db.Item{}
	require.NoError(t, json.Unmarshal(res.Body(), &items))
	return items
}

func unmarshalItem(t *testing.T, res *handlertest.HttpResult) *db.Item {
	t.Helper()
	item := &db.Item{}
	require.NoError(t, json.Unmarshal(res.Body(), item))
	return item
}

func TestItemList(t *testing.T) {
	t.Run("requires username or id", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			e.do(controller.ItemList, http.MethodGet, "/item", "", nil).
				AssertStatus(422)
		})
	})

	t.Run("lists items by username", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			a := createItem(t, tx, alice.ID, "item a", 0)
			b := createItem(t, tx, alice.ID, "item b", 1)

			res := e.do(controller.ItemList, http.MethodGet, "/item?username=alice", "", nil)
			res.AssertStatus(200)

			items := unmarshalItems(t, res)
			require.Len(t, items, 2)
			assert.Equal(t, a.ID, items[0].ID)
			assert.Equal(t, "item a", items[0].Name)
			assert.Equal(t, "alice", items[0].Username)
			assert.Equal(t, b.ID, items[1].ID)
			assert.Equal(t, "item b", items[1].Name)
			assert.Nil(t, items[1].ThinkingCount)
			assert.Nil(t, items[1].PurchasedCount)
		})
	})

	t.Run("lists items by id", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			bob := createUser(t, tx, "bob")
			aliceItem := createItem(t, tx, alice.ID, "alice item", 0)
			bobItem := createItem(t, tx, bob.ID, "bob item", 0)

			res := e.do(controller.ItemList, http.MethodGet, fmt.Sprintf("/item?id=%d", bobItem.ID), "", nil)
			res.AssertStatus(200)

			items := unmarshalItems(t, res)
			require.Len(t, items, 1)
			assert.Equal(t, bobItem.ID, items[0].ID)
			assert.Equal(t, "bob item", items[0].Name)
			assert.NotEqual(t, aliceItem.ID, items[0].ID)
		})
	})

	t.Run("orders items by the order column", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			for _, ins := range []struct {
				name  string
				order int
			}{
				{"third", 2},
				{"first", 0},
				{"second", 1},
			} {
				_, err := tx.Exec(`INSERT INTO items ("user_id", "name", "description", "url", "order", "created_at", "updated_at") VALUES (?, ?, '', '', ?, datetime('now'), datetime('now'))`, alice.ID, ins.name, ins.order)
				require.NoError(t, err)
			}

			res := e.do(controller.ItemList, http.MethodGet, "/item?username=alice", "", nil)
			res.AssertStatus(200)

			items := unmarshalItems(t, res)
			require.Len(t, items, 3)
			assert.Equal(t, 0, items[0].Order)
			assert.Equal(t, "first", items[0].Name)
			assert.Equal(t, 1, items[1].Order)
			assert.Equal(t, "second", items[1].Name)
			assert.Equal(t, 2, items[2].Order)
			assert.Equal(t, "third", items[2].Name)
		})
	})
}

func TestItemListCounts(t *testing.T) {
	t.Run("shows thinking and purchased counts to a logged in viewer", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			bob := createUser(t, tx, "bob")
			carol := createUser(t, tx, "carol")

			item1 := createItem(t, tx, alice.ID, "item1", 0)
			item2 := createItem(t, tx, alice.ID, "item2", 1)

			createUserItem(t, tx, carol.ID, item1.ID, "thinking")
			createUserItem(t, tx, bob.ID, item1.ID, "thinking")
			createUserItem(t, tx, carol.ID, item2.ID, "purchased")

			res := e.do(controller.ItemList, http.MethodGet, "/item?username=alice", tokenForUser(t, bob.ID), nil)
			res.AssertStatus(200)

			items := unmarshalItems(t, res)
			require.Len(t, items, 2)

			require.NotNil(t, items[0].ThinkingCount)
			assert.Equal(t, 1, items[0].ThinkingCount.Int())
			require.NotNil(t, items[0].PurchasedCount)
			assert.Equal(t, 0, items[0].PurchasedCount.Int())

			require.NotNil(t, items[1].ThinkingCount)
			assert.Equal(t, 0, items[1].ThinkingCount.Int())
			require.NotNil(t, items[1].PurchasedCount)
			assert.Equal(t, 1, items[1].PurchasedCount.Int())
		})
	})

	t.Run("hides counts when not logged in", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			carol := createUser(t, tx, "carol")
			item1 := createItem(t, tx, alice.ID, "item1", 0)
			createUserItem(t, tx, carol.ID, item1.ID, "thinking")

			res := e.do(controller.ItemList, http.MethodGet, "/item?username=alice", "", nil)
			res.AssertStatus(200)

			items := unmarshalItems(t, res)
			require.Len(t, items, 1)
			assert.Nil(t, items[0].ThinkingCount)
			assert.Nil(t, items[0].PurchasedCount)
		})
	})
}

func TestItemCreate(t *testing.T) {
	t.Run("requires login", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			e.do(controller.ItemCreate, http.MethodPost, "/item", "", map[string]any{
				"name": "foo",
			}).
				AssertStatus(401)
		})
	})

	t.Run("validates name is required", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			e.do(controller.ItemCreate, http.MethodPost, "/item", tokenForUser(t, alice.ID), map[string]any{}).
				AssertStatus(422)
		})
	})

	t.Run("creates an item", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")

			res := e.do(controller.ItemCreate, http.MethodPost, "/item", tokenForUser(t, alice.ID), map[string]any{
				"name":        "a great book",
				"description": "written by someone",
				"price":       1000,
			})
			res.AssertStatus(200)

			item := unmarshalItem(t, res)
			assert.Equal(t, "a great book", item.Name)
			assert.Equal(t, "written by someone", item.Description)
			assert.Equal(t, "alice", item.Username)
			assert.Equal(t, 0, item.Order)
			require.NotNil(t, item.Price)
			assert.Equal(t, 1000, item.Price.Int())

			saved := findItem(t, tx, item.ID)
			assert.Equal(t, alice.ID, saved.UserID)
			assert.Equal(t, "a great book", saved.Name)
		})
	})

	t.Run("uses the name as the url when it starts with https://", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")

			res := e.do(controller.ItemCreate, http.MethodPost, "/item", tokenForUser(t, alice.ID), map[string]any{
				"name":  "https://example.com/product/1",
				"price": 500,
			})
			res.AssertStatus(200)

			item := unmarshalItem(t, res)
			assert.Equal(t, "https://example.com/product/1", item.URL)
			assert.Equal(t, "", item.Name)

			saved := findItem(t, tx, item.ID)
			assert.Equal(t, "https://example.com/product/1", saved.URL)
		})
	})

	t.Run("sets the order to the number of existing items", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			createItem(t, tx, alice.ID, "existing 1", 0)
			createItem(t, tx, alice.ID, "existing 2", 1)

			res := e.do(controller.ItemCreate, http.MethodPost, "/item", tokenForUser(t, alice.ID), map[string]any{
				"name": "newest",
			})
			res.AssertStatus(200)

			item := unmarshalItem(t, res)
			assert.Equal(t, 2, item.Order)
		})
	})
}

func TestItemUpdate(t *testing.T) {
	t.Run("requires login", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			item := createItem(t, tx, alice.ID, "old name", 0)

			e.do(controller.ItemUpdate, http.MethodPut, "/item", "", map[string]any{
				"id":    item.ID,
				"name":  "new name",
				"order": 0,
			}).
				AssertStatus(401)
		})
	})

	t.Run("updates an item", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			item := createItem(t, tx, alice.ID, "old name", 0)

			res := e.do(controller.ItemUpdate, http.MethodPut, "/item", tokenForUser(t, alice.ID), map[string]any{
				"id":          item.ID,
				"name":        "new name",
				"description": "a new description",
				"url":         "https://example.com",
				"price":       2500,
				"order":       0,
			})
			res.AssertStatus(200)

			updated := unmarshalItem(t, res)
			assert.Equal(t, "new name", updated.Name)
			assert.Equal(t, "a new description", updated.Description)
			assert.Equal(t, "https://example.com", updated.URL)
			require.NotNil(t, updated.Price)
			assert.Equal(t, 2500, updated.Price.Int())

			saved := findItem(t, tx, item.ID)
			assert.Equal(t, "new name", saved.Name)
			assert.Equal(t, 2500, saved.Price.Int())
		})
	})

	t.Run("rejects updating another user's item", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			bob := createUser(t, tx, "bob")
			item := createItem(t, tx, alice.ID, "alice's item", 0)

			e.do(controller.ItemUpdate, http.MethodPut, "/item", tokenForUser(t, bob.ID), map[string]any{
				"id":    item.ID,
				"name":  "hacked",
				"order": 0,
			}).
				AssertStatus(401)

			saved := findItem(t, tx, item.ID)
			assert.Equal(t, "alice's item", saved.Name)
		})
	})

	t.Run("reorders items when moving down", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			first := createItem(t, tx, alice.ID, "first", 0)
			second := createItem(t, tx, alice.ID, "second", 1)
			third := createItem(t, tx, alice.ID, "third", 2)

			res := e.do(controller.ItemUpdate, http.MethodPut, "/item", tokenForUser(t, alice.ID), map[string]any{
				"id":    first.ID,
				"name":  "first",
				"price": 100,
				"order": 2,
			})
			res.AssertStatus(200)

			updated := unmarshalItem(t, res)
			assert.Equal(t, 2, updated.Order)

			items := loadItems(t, tx, alice.ID)
			require.Len(t, items, 3)
			assert.Equal(t, second.ID, items[0].ID)
			assert.Equal(t, 0, items[0].Order)
			assert.Equal(t, third.ID, items[1].ID)
			assert.Equal(t, 1, items[1].Order)
			assert.Equal(t, first.ID, items[2].ID)
			assert.Equal(t, 2, items[2].Order)
		})
	})

	t.Run("reorders items when moving up", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			first := createItem(t, tx, alice.ID, "first", 0)
			second := createItem(t, tx, alice.ID, "second", 1)
			third := createItem(t, tx, alice.ID, "third", 2)

			res := e.do(controller.ItemUpdate, http.MethodPut, "/item", tokenForUser(t, alice.ID), map[string]any{
				"id":    third.ID,
				"name":  "third",
				"price": 100,
				"order": 0,
			})
			res.AssertStatus(200)

			updated := unmarshalItem(t, res)
			assert.Equal(t, 0, updated.Order)

			items := loadItems(t, tx, alice.ID)
			require.Len(t, items, 3)
			assert.Equal(t, third.ID, items[0].ID)
			assert.Equal(t, 0, items[0].Order)
			assert.Equal(t, first.ID, items[1].ID)
			assert.Equal(t, 1, items[1].Order)
			assert.Equal(t, second.ID, items[2].ID)
			assert.Equal(t, 2, items[2].Order)
		})
	})
}

func TestItemDelete(t *testing.T) {
	t.Run("requires login", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			item := createItem(t, tx, alice.ID, "item", 0)

			e.do(controller.ItemDelete, http.MethodDelete, "/item", "", map[string]any{
				"id": item.ID,
			}).
				AssertStatus(401)
		})
	})

	t.Run("deletes an item and reconciles the order", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			first := createItem(t, tx, alice.ID, "first", 0)
			second := createItem(t, tx, alice.ID, "second", 1)
			third := createItem(t, tx, alice.ID, "third", 2)

			res := e.do(controller.ItemDelete, http.MethodDelete, "/item", tokenForUser(t, alice.ID), map[string]any{
				"id": second.ID,
			})
			res.AssertStatus(200)
			res.AssertJSONContains("success", true)

			items := loadItems(t, tx, alice.ID)
			require.Len(t, items, 2)
			assert.Equal(t, first.ID, items[0].ID)
			assert.Equal(t, 0, items[0].Order)
			assert.Equal(t, third.ID, items[1].ID)
			assert.Equal(t, 1, items[1].Order)

			require.NotNil(t, findItem(t, tx, first.ID))
			require.Nil(t, findItem(t, tx, second.ID))
		})
	})

	t.Run("does not delete another user's item", func(t *testing.T) {
		runner.Run(t, "", func(t *testing.T, tx *sqlx.Tx) {
			e := newEnv(t, tx)
			alice := createUser(t, tx, "alice")
			bob := createUser(t, tx, "bob")
			item := createItem(t, tx, alice.ID, "alice's item", 0)

			res := e.do(controller.ItemDelete, http.MethodDelete, "/item", tokenForUser(t, bob.ID), map[string]any{
				"id": item.ID,
			})
			res.AssertStatus(200)
			res.AssertJSONContains("success", true)

			require.NotNil(t, findItem(t, tx, item.ID))
		})
	})
}
