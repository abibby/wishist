package db

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/abibby/nulls"
	"github.com/abibby/salusa/database/builder"
	"github.com/abibby/salusa/database/model"
	"github.com/abibby/salusa/database/model/mixins"
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

	req, err := http.NewRequest("GET", i.URL, nil)
	if err != nil {
		return fmt.Errorf("update item price: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "none")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Priority", "u=0, i")
	req.Header.Set("TE", "trailers")

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("update item price: %w", err)
	}
	defer resp.Body.Close()

	meta, err := extract(resp.Body)
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
