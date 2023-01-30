package auth

import (
	"time"

	"github.com/abibby/wishist/config"
	"github.com/golang-jwt/jwt/v4"
)

type TokenOptions func(claims jwt.MapClaims) jwt.MapClaims

func GenerateToken(modifyClaims ...TokenOptions) (string, error) {
	t := time.Now().Unix()
	claims := jwt.MapClaims{
		"iat": t,
		"nbf": t,
	}
	for _, m := range modifyClaims {
		claims = m(claims)
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS512, claims).SignedString(config.AppKey)
}

func WithLifetime(duration time.Duration) TokenOptions {
	return WithExpirationTime(time.Now().Add(duration))
}
func WithIssuer(iss int) TokenOptions {
	return WithClaim("iss", iss)
}
func WithSubject[T string | int](sub T) TokenOptions {
	return WithClaim("sub", sub)
}
func WithAudience(aud string) TokenOptions {
	return WithClaim("aud", aud)
}
func WithExpirationTime(exp time.Time) TokenOptions {
	return WithClaim("exp", exp.Unix())
}
func WithNotBeforeTime(nbf time.Time) TokenOptions {
	return WithClaim("nbf", nbf.Unix())
}
func WithIssuedAtTime(iat time.Time) TokenOptions {
	return WithClaim("iat", iat.Unix())
}
func WithJWTID(jti string) TokenOptions {
	return WithClaim("jit", jti)
}
func WithClaim(key string, value any) TokenOptions {
	return func(claims jwt.MapClaims) jwt.MapClaims {
		claims[key] = value
		return claims
	}
}
