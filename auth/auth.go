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
	claims, ok := jwtClaims(ctx)
	if !ok {
		return 0, false
	}

	uid, ok := claims["sub"]
	if !ok {
		return 0, false
	}
	return int(uid.(float64)), true
}
func jwtPurpose(ctx context.Context) (Purpose, bool) {
	claims, ok := jwtClaims(ctx)
	if !ok {
		return "", false
	}

	uid, ok := claims["purpose"]
	if !ok {
		return "", false
	}
	return uid.(Purpose), true
}

func jwtClaims(ctx context.Context) (jwt.MapClaims, bool) {
	iClaims := ctx.Value("jwt-claims")
	claims, ok := iClaims.(jwt.MapClaims)
	return claims, ok
}

func setClaims(r *http.Request, claims jwt.MapClaims) {
	newRequest := r.WithContext(context.WithValue(r.Context(), "jwt-claims", claims))
	*r = *newRequest
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := authenticate(r)
		if !ok {
			handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
			return
		}
		setClaims(r, claims)

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
		claims["username"] = u.Username
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

func authenticate(r *http.Request) (jwt.MapClaims, bool) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, false
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
		return nil, false
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, false
	}

	return claims, true
}
