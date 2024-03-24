package controller

import (
	"context"
	"strconv"

	"github.com/abibby/salusa/auth"
)

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
