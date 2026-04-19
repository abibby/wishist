package db

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/abibby/nulls"
	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/model/mixins"
	"github.com/chromedp/chromedp"
	"golang.org/x/net/html"
)

var httpClient = &http.Client{}
var priceRegexp = regexp.MustCompile(`\$\d+\.\d\d`)

//go:generate spice generate:migration
type Item struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	ID             int        `db:"id,autoincrement,primary" json:"id"`
	UserID         int        `db:"user_id"                  json:"user_id"`
	Name           string     `db:"name"                     json:"name"`
	Description    string     `db:"description"              json:"description"`
	URL            string     `db:"url"                      json:"url"`
	Price          *nulls.Int `db:"price"                    json:"price"`
	Order          int        `db:"order"                    json:"order"`
	ThinkingCount  *nulls.Int `db:"thinking_count,readonly"  json:"thinking_count,omitempty"`
	PurchasedCount *nulls.Int `db:"purchased_count,readonly" json:"purchased_count,omitempty"`
}

func ItemQuery(ctx context.Context) *builder.ModelBuilder[*Item] {
	return builder.From[*Item]().WithContext(ctx)
}

func (i *Item) UpdateFromURL() error {
	if i.URL == "" {
		return nil
	}

	html, err := chromeRequest(i.URL)
	if err != nil {
		return fmt.Errorf("update item price: %w", err)
	}

	os.WriteFile("./a.html", []byte(html), 0644)
	meta, err := extract(bytes.NewBufferString(html))
	if err != nil {
		return fmt.Errorf("update item price: %w", err)
	}

	if meta.Price != "" && i.Price == nil {
		fPrice, err := strconv.ParseFloat(meta.Price, 64)
		if err != nil {
			return fmt.Errorf("update item price: %w", err)
		}

		i.Price = nulls.NewInt(int(fPrice * 100))
	}

	if meta.Title != "" && i.Name == "" {
		i.Name = meta.Title
	}

	return nil
}

var chromeContext = sync.OnceValues(func() (context.Context, context.CancelFunc) {
	return chromedp.NewContext(context.Background())
})

func chromeRequest(uri string) (string, error) {
	ctx, _ := chromeContext()

	var body string
	err := chromedp.Run(ctx,
		chromedp.Navigate(uri),
		// chromedp.OuterHTML("html", &body, chromedp.ByQuery),
	)
	if err != nil {
		return "", err
	}

	time.Sleep(time.Second * 10)

	err = chromedp.Run(ctx,
		chromedp.OuterHTML("html", &body, chromedp.ByQuery),
	)
	if err != nil {
		return "", err
	}

	return body, nil
}

type meta struct {
	Price       string
	Title       string
	Description string
}

func extract(resp io.Reader) (*meta, error) {
	meta := &meta{}
	z := html.NewTokenizer(resp)

	inBody := false
	tag := ""

	for {
		tt := z.Next()
		switch tt {
		case html.ErrorToken:
			if errors.Is(z.Err(), io.EOF) {
				return meta, nil
			}
			return nil, fmt.Errorf("extract price: %w", z.Err())

		case html.StartTagToken:
			t := z.Token()
			tag = t.Data
			switch t.Data {
			case "meta":
				price, ok := extractMetaProperty(t, ":price:amount")
				if ok {
					meta.Price = price
				}
				title, ok := extractMetaProperty(t, "og:title")
				if ok {
					meta.Title = title
				}
				description, ok := extractMetaProperty(t, "og:description")
				if ok {
					meta.Description = description
				}
			case "input":
				price, ok := extractInputValue(t, "attach-base-product-price")
				if ok {
					meta.Price = price
				}
			case "body":
				inBody = true
			}

		case html.EndTagToken:
			t := z.Token()
			if t.Data == "body" {
				inBody = false
			}

		case html.TextToken:
			t := z.Token()
			if tag == "title" {
				if meta.Title == "" {
					meta.Title = t.String()
				}
			} else if inBody {
				if meta.Price == "" {
					price := priceRegexp.FindString(t.String())
					if price != "" {
						meta.Price = price[1:]
					}
				}
			}
		}
	}
}

func extractMetaProperty(t html.Token, prop string) (content string, ok bool) {
	for _, attr := range t.Attr {
		if attr.Key == "property" && strings.HasSuffix(attr.Val, prop) {
			ok = true
		}

		if attr.Key == "content" {
			content = attr.Val
		}
	}

	return
}
func extractInputValue(t html.Token, id string) (value string, ok bool) {
	for _, attr := range t.Attr {
		if attr.Key == "id" && attr.Val == id {
			ok = true
		}

		if attr.Key == "value" {
			value = attr.Val
		}
	}

	return
}

//go:generate spice generate:migration
type UserItem struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	UserID     int    `db:"user_id,primary"       json:"-"`
	ItemID     int    `db:"item_id,primary"       json:"item_id"`
	Type       string `db:"type"                  json:"type"`
	ItemUserID int    `db:"item_user_id,readonly" json:"item_user_id"`
}

func UserItemQuery(ctx context.Context) *builder.ModelBuilder[*UserItem] {
	return builder.From[*UserItem]().WithContext(ctx)
}

//go:generate spice generate:migration
type Friend struct {
	model.BaseModel
	mixins.Timestamps
	mixins.SoftDelete
	UserID         int    `db:"user_id,primary"          json:"-"`
	FriendID       int    `db:"friend_id,primary"        json:"friend_id"`
	FriendName     string `db:"friend_name,readonly"     json:"friend_name"`
	FriendUsername string `db:"friend_username,readonly" json:"friend_username"`
}

func FriendQuery(ctx context.Context) *builder.ModelBuilder[*Friend] {
	return builder.From[*Friend]().WithContext(ctx)
}
