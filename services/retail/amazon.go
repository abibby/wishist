package retail

import (
	"bytes"
	"context"
	"fmt"
	"net/url"
	"strings"
	"sync"

	"github.com/chromedp/chromedp"
)

type Amazon struct {
	ctx   context.Context
	close context.CancelFunc
	mtx   sync.Mutex
}

var _ Retail = (*Amazon)(nil)

func NewAmazon(ctx context.Context) *Amazon {
	ctx, cancel := chromedp.NewContext(context.Background())
	return &Amazon{
		ctx:   ctx,
		close: cancel,
	}
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
func (a *Amazon) Details(uri string) (*Product, error) {
	var html string
	a.mtx.Lock()
	defer a.mtx.Unlock()

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

func (a *Amazon) Close() error {
	a.close()
	return nil
}
