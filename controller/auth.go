package controller

import (
	"github.com/abibby/validate/handler"
	"github.com/abibby/wishlist/auth"
)

type InviteRequest struct{}
type InviteResponse struct {
	InviteToken string `json:"invite_token"`
}

var Invite = handler.Handler(func(r *InviteRequest) (any, error) {
	inviteToken, err := auth.GenerateToken(WithPurpose(PurposeInvite))
	if err != nil {
		return nil, err
	}
	return &InviteResponse{
		InviteToken: inviteToken,
	}, nil
})
