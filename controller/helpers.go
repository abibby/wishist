package controller

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/abibby/salusa/auth"
	"github.com/abibby/salusa/request"
)

func mustUserID(ctx context.Context) int {
	uid, ok := userID(ctx)
	if !ok {
		panic(request.NewHTTPError(fmt.Errorf(http.StatusText(401)), 401))
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
