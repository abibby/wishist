package retail

import (
	"context"
	"fmt"

	"gosalusa.com/di"
)

type Service interface {
	Fetch(ctx context.Context, uri string) (*Product, error)
}

type RetailServiceImpl struct {
	providers []Retail
}

func NewService() Service {
	return &RetailServiceImpl{
		providers: []Retail{
			NewAmazon(),
			NewLego(),
			NewOpenGraph(),
		},
	}
}

func Register(ctx context.Context) {
	di.RegisterLazySingleton(ctx, func() (Service, error) {
		return NewService(), nil
	})
}

// Fetch implements [Service].
func (r *RetailServiceImpl) Fetch(ctx context.Context, uri string) (*Product, error) {
	for _, p := range r.providers {
		if !p.Check(uri) {
			continue
		}
		prod, err := p.Details(ctx, uri)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", p.Name(), err)
		}
		return prod, nil
	}
	return nil, fmt.Errorf("%w %s", ErrMissingProvider, uri)
}
