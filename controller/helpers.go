package controller

import (
	"context"

	"github.com/abibby/salusa/auth"
)

func userID(ctx context.Context) (int, bool) {
	claims, ok := auth.Claims(ctx)
	if !ok {
		return 0, false
	}
	uid, ok := claims["sub"]
	if !ok {
		return 0, false
	}
	return int(uid.(float64)), true
}
