package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/abibby/wishist/config"
	"github.com/golang-jwt/jwt/v4"
	"github.com/stretchr/testify/assert"
)

func TestAuthenticate(t *testing.T) {
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"sub": "test",
	}).SignedString(config.AppKey)
	if err != nil {
		assert.NoError(t, err)
		return
	}

	r := httptest.NewRequest("GET", "https://example.com", http.NoBody)
	r.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	c, err := authenticate(r)

	assert.NoError(t, err)
	assert.Equal(t, "test", c["sub"])
}
