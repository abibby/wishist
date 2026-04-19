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
}

var _ Retail = (*Amazon)(nil)

func NewAmazon() *Amazon {
	return &Amazon{}
}

// Name implements [Retail].
func (a *Amazon) Name() string {
	return "amazon"
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
func (a *Amazon) Details(ctx context.Context, uri string) (*Product, error) {
	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	var html string

	err := chromedp.Run(ctx,
		chromedp.Navigate(uri),
		chromedp.OuterHTML("html", &html, chromedp.ByQuery),
	)
	if err != nil {
		return nil, fmt.Errorf("download html: %w", err)
	}

	product := &Product{}
	priceStr := ""
	err = htmlExtractor(bytes.NewBufferString(html),
		propertyByElementID("productTitle", "value", &product.Title),
		propertyByElementID("attach-base-product-price", "value", &priceStr),
	)
	if err != nil {
		return nil, fmt.Errorf("extract values: %w", err)
	}

	product.Price, err = parsePrice(priceStr)
	if err != nil {
		return nil, fmt.Errorf("parse price: %w", err)
	}
	product.URL = uri
	product.Currency = "CAD"

	return product, nil
}
