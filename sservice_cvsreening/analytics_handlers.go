package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== ANALYTICS HANDLERS ====================

// getHRAnalyticsHandler returns HR Analytics Dashboard data
func getHRAnalyticsHandler(c *gin.Context) {
	data, err := repository.GetHRAnalytics(c.Request.Context())
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to get HR analytics", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}
