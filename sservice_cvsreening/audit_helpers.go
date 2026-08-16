package main

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// logAudit is a thin wrapper around the existing audit_trail system (repository.LogAuditTrail,
// already used by employee photo uploads and approval actions) so new call sites don't have to
// repeat the UserID/UserEmail/IPAddress/UserAgent boilerplate. Fire-and-forget (go func), same
// as every existing caller — an audit log failure must never block the actual business action.
func logAudit(c *gin.Context, action, module, entityType string, entityID int) {
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     action,
		Module:     module,
		EntityType: entityType,
		EntityID:   &entityID,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})
}
