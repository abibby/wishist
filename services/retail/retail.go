package retail

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

type Retail interface {
	Name() string
	Check(uri string) bool
	Details(uri string) (*Product, error)
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
	NewAmazon(context.Background()),
	NewLego(),
	NewOpenGraph(),
}

func Fetch(uri string) (*Product, error) {
	for _, p := range providers {
		if !p.Check(uri) {
			continue
		}
		prod, err := p.Details(uri)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", p.Name(), err)
		}
		return prod, nil
	}
	return nil, fmt.Errorf("%w %s", ErrMissingProvider, uri)
}

func parsePrice(price string) (int, error) {
	f, err := strconv.ParseFloat(strings.TrimLeft(price, "$"), 64)
	if err != nil {
		return 0, err
	}
	return int(math.Round(f * 100)), nil
}
