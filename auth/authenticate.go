package auth

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/abibby/wishlist/config"
	"github.com/golang-jwt/jwt/v4"
	"github.com/pkg/errors"
)

var (
	ErrMissingAuthorizationHeader = fmt.Errorf("missing Authorization header")
	ErrUnexpectedAlgorithm        = fmt.Errorf("unexpected algorithm")
	ErrInvalidToken               = fmt.Errorf("invalid token")
)

func authenticate(r *http.Request) (jwt.MapClaims, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, ErrMissingAuthorizationHeader
	}
	tokenStr := authHeader[7:]

	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.Wrapf(ErrUnexpectedAlgorithm, "expected HMAC received %v", token.Header["alg"])
		}

		return config.AppKey, nil
	})
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse JWT")
	}
	if !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
