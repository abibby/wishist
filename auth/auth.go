package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/config"
	"github.com/abibby/wishlist/db"
	"github.com/golang-jwt/jwt/v4"
)

type Purpose string

const (
	PurposeLogin   = Purpose("login")
	PurposeRefresh = Purpose("refresh")
)

type TokenOptions func(claims jwt.MapClaims) jwt.MapClaims

func UserID(ctx context.Context) (int, bool) {
	iUserID := ctx.Value("user-id")
	userID, ok := iUserID.(int)
	return userID, ok
}

func setUserID(r *http.Request, uid int) {
	newRequest := r.WithContext(context.WithValue(r.Context(), "user-id", uid))
	*r = *newRequest
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ok, _ := authenticate(r)
		if !ok {
			handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func GenerateToken(u *db.User, modifyClaims ...TokenOptions) (string, error) {
	t := time.Now().Unix()
	claims := jwt.MapClaims{
		"iat": t,
		"nbf": t,
	}
	if u != nil {
		claims["sub"] = u.ID
	}
	for _, m := range modifyClaims {
		claims = m(claims)
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(config.AppKey)
}

func WithLifetime(duration time.Duration) TokenOptions {
	return WithClaim("exp", time.Now().Add(duration).Unix())
}
func WithClaim(k string, v any) TokenOptions {
	return func(claims jwt.MapClaims) jwt.MapClaims {
		claims[k] = v
		return claims
	}
}
func WithPurpose(purpose Purpose) TokenOptions {
	return WithClaim("purpose", purpose)
}

func authenticate(r *http.Request) (bool, jwt.MapClaims) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return false, nil
	}
	tokenStr := authHeader[7:]

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return config.AppKey, nil
	})
	if err != nil {
		log.Printf("failed to parse JWT: %v", err)
		return false, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return false, nil
	}

	if uid, ok := claims["sub"]; ok {
		setUserID(r, uid.(int))
	}
	return true, claims
}
