package retail

import (
	"context"
	"net/http"
)

type OpenGraph struct {
	httpClient *http.Client
}

var _ Retail = (*OpenGraph)(nil)

func NewOpenGraph() *OpenGraph {
	return &OpenGraph{
		httpClient: http.DefaultClient,
	}
}

// Name implements [Retail].
func (o *OpenGraph) Name() string {
	return "open graph"
}

// Check implements [Retail].
func (o *OpenGraph) Check(uri string) bool {
	return true
}

// Details implements [Retail].
func (o *OpenGraph) Details(ctx context.Context, uri string) (*Product, error) {
	resp, err := o.httpClient.Get(uri)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	product := &Product{}

	var priceStr string
	err = htmlExtractor(resp.Body,
		// openGraphProperty("og:site_name", nil),
		openGraphProperty("og:url", &product.URL),
		openGraphProperty("og:title", &product.Title),
		// openGraphProperty("og:type", nil),
		openGraphProperty("og:description", &product.Description),
		openGraphProperty("og:image", &product.Image),
		// openGraphProperty("og:image:secure_url", nil),
		// openGraphProperty("og:image:width", nil),
		// openGraphProperty("og:image:height", nil),
		openGraphProperty("og:price:amount", &priceStr),
		openGraphProperty("og:price:currency", &product.Currency),
	)
	if err != nil {
		return nil, err
	}

	product.Price, err = parsePrice(priceStr)
	if err != nil {
		return nil, err
	}

	return product, nil
}
