package controller

import (
	"context"
	"strconv"

	"github.com/abibby/salusa/auth"
)

func mustUserID(ctx context.Context) int {
	uid, ok := userID(ctx)
	if !ok {
		panic("no user id")
	}
	return uid
}
func userID(ctx context.Context) (int, bool) {
	claims, ok := auth.GetClaimsCtx(ctx)
	if !ok {
		return 0, false
	}

	uid, err := strconv.Atoi(claims.Subject)
	if err != nil {
		return 0, false
	}
	return uid, true
}
