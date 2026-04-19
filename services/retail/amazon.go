package retail

import (
	"bytes"
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/chromedp/chromedp"
)

type Amazon struct {
	ctx   context.Context
	close context.CancelFunc
}

var _ Retail = (*Amazon)(nil)

func NewAmazon(ctx context.Context) *Amazon {
	ctx, cancel := chromedp.NewContext(context.Background())
	return &Amazon{
		ctx:   ctx,
		close: cancel,
	}
}

// Check implements [Retail].
func (a *Amazon) Check(uri string) bool {
	u, err := url.Parse(uri)
	if err != nil {
		return false
	}

	return strings.HasSuffix(u.Host, "amazon.ca")
}

// Details implements [Retail].
func (a *Amazon) Details(uri string) (*Product, error) {
	var html string

	err := chromedp.Run(a.ctx,
		chromedp.Navigate(uri),
		chromedp.OuterHTML("html", &html, chromedp.ByQuery),
	)
	if err != nil {
		return nil, fmt.Errorf("download html: %w", err)
	}

	product := &Product{}
	priceStr := ""
	err = htmlExtractor(bytes.NewBufferString(html),
		// openGraphProperty("og:url", &product.URL),
		propertyByElementID("productTitle", "value", &product.Title),
		// openGraphProperty("og:description", &product.Description),
		// openGraphProperty("og:image", &product.Image),
		propertyByElementID("attach-base-product-price", "value", &priceStr),
		// openGraphProperty("og:price:currency", &product.Currency),
	)
	if err != nil {
		return nil, fmt.Errorf("extract values: %w", err)
	}

	product.Price, err = parsePrice(priceStr)
	if err != nil {
		return nil, fmt.Errorf("parse price: %w", err)
	}
	product.URL = uri

	return product, nil
}

func (a *Amazon) Close() error {
	a.close()
	return nil
}
