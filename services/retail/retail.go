package retail

import (
	"context"
	"errors"
	"math"
	"strconv"
	"strings"
)

type Retail interface {
	Name() string
	Check(uri string) bool
	Details(ctx context.Context, uri string) (*Product, error)
}

type Product struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
	URL         string `json:"url"`
	Price       int    `json:"price"`
	Currency    string `json:"currency"`
}

var ErrMissingProvider = errors.New("no provider for uri")

var providers = []Retail{
	NewAmazon(),
	NewLego(),
	NewOpenGraph(),
}

func parsePrice(price string) (int, error) {
	f, err := strconv.ParseFloat(strings.TrimLeft(price, "$"), 64)
	if err != nil {
		return 0, err
	}
	return int(math.Round(f * 100)), nil
}
