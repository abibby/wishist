package controller

import (
	"context"

	"github.com/abibby/wishlist/auth"
)

func userID(ctx context.Context) int {
	claims, ok := auth.Claims(ctx)
	if !ok {
		panic("could not find claims")
	}
	uid, ok := claims["sub"]
	if !ok {
		panic("sub not set on claims")
	}
	return int(uid.(float64))
}
