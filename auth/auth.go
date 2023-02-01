package auth

import (
	"context"
	"fmt"
	"net/http"

	"github.com/abibby/validate/handler"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
)

func Claims(ctx context.Context) (jwt.MapClaims, bool) {
	iClaims := ctx.Value("jwt-claims")
	claims, ok := iClaims.(jwt.MapClaims)
	return claims, ok
}

func UserIDFactory[T any](cb func(claims jwt.MapClaims) (T, bool)) func(ctx context.Context) (T, bool) {
	return func(ctx context.Context) (T, bool) {
		var zero T
		claims, ok := Claims(ctx)
		if !ok {
			return zero, false
		}

		return cb(claims)
	}
}

func setClaims(r *http.Request, claims jwt.MapClaims) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), "jwt-claims", claims))
}

func AttachUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, err := authenticate(r)
		if err == nil {
			next.ServeHTTP(w, setClaims(r, claims))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func LoggedIn(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, ok := Claims(r.Context())
		if !ok {
			handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func HasClaim(key string, value any) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := Claims(r.Context())
			if !ok {
				handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
				return
			}
			claim, ok := claims[key]
			if !ok {
				handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
				return
			}
			if claim != value {
				handler.ErrorResponse(fmt.Errorf("unauthorized"), http.StatusUnauthorized).Respond(w)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
