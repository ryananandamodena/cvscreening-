package main

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// Simple in-memory rate limiter using Fixed Window
type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.Mutex
}

type visitor struct {
	lastSeen time.Time
	count    int
}

var globalLimiter = &RateLimiter{
	visitors: make(map[string]*visitor),
}

// InitRateLimiter starts the background cleanup routine
func InitRateLimiter() {
	go globalLimiter.Cleanup()
}

func (rl *RateLimiter) Allow(ip string, limit int, window time.Duration) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		rl.visitors[ip] = &visitor{lastSeen: time.Now(), count: 1}
		return true
	}

	if time.Since(v.lastSeen) > window {
		v.lastSeen = time.Now()
		v.count = 1
		return true
	}

	if v.count >= limit {
		return false
	}

	v.count++
	return true
}

// Cleanup removes old entries to prevent memory leaks
func (rl *RateLimiter) Cleanup() {
	for range time.Tick(1 * time.Minute) {
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > 10*time.Minute {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware enforces rate limits
// limit: number of requests allowed
// window: time window
func RateLimitMiddleware(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !globalLimiter.Allow(ip, limit, window) {

			// Log security event
			// Use 0 for system (NULL in DB)
			repository.LogActivity(context.Background(), 0, "security_alert", "system", 0, "Rate limit exceeded for IP: "+ip, ip)

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate_limit_exceeded",
				"message": "Too many requests. Please try again later.",
			})
			return
		}
		c.Next()
	}
}
