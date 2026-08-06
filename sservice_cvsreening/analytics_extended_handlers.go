package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// getWorkforceAnalyticsHandler returns real workforce metrics computed from the
// employees/departments tables. Optional query params: start, end (YYYY-MM-DD).
func getWorkforceAnalyticsHandler(c *gin.Context) {
	start := c.Query("start")
	end := c.Query("end")

	data, err := repository.GetWorkforceMetrics(c.Request.Context(), start, end)
	if err != nil {
		log.Printf("ERROR in getWorkforceAnalyticsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to compute workforce metrics", err.Error())
		return
	}
	c.JSON(http.StatusOK, data)
}

// getAdvancedPerformanceAnalyticsHandler returns real performance metrics from
// performance_reviews, for the Advanced Analytics dashboard. This is distinct from
// getPerformanceAnalyticsHandler (extended_handlers.go), which backs the separate
// /performance/analytics endpoint used by the Performance module's own dashboard.
func getAdvancedPerformanceAnalyticsHandler(c *gin.Context) {
	data, err := repository.GetPerformanceAnalyticsData(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getAdvancedPerformanceAnalyticsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to compute performance analytics", err.Error())
		return
	}
	c.JSON(http.StatusOK, data)
}

// getPredictiveAnalyticsHandler returns a rule-based (not ML) forecast derived from
// real turnover/headcount data. Response includes isHeuristic:true so the frontend
// can label it accordingly instead of presenting it as a trained prediction model.
func getPredictiveAnalyticsHandler(c *gin.Context) {
	data, err := repository.GetPredictiveAnalyticsData(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getPredictiveAnalyticsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to compute predictive analytics", err.Error())
		return
	}
	c.JSON(http.StatusOK, data)
}

// getRealtimeAnalyticsHandler returns a live snapshot of a few operational counters.
// Cheap to poll; intended to be called on a short interval from the dashboard.
func getRealtimeAnalyticsHandler(c *gin.Context) {
	data, err := repository.GetRealtimeMetrics(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getRealtimeAnalyticsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to compute realtime metrics", err.Error())
		return
	}
	c.JSON(http.StatusOK, data)
}
