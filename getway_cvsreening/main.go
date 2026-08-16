package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Request Logging Middleware
	r.Use(func(c *gin.Context) {
		log.Printf("Incoming request: %s %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
		log.Printf("Response status: %d", c.Writer.Status())
	})

	// Configurable CORS origins
	allowedOrigins := getGatewayAllowedOrigins()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "gateway up",
		})
	})

	// Configurable backend service URL
	serviceURL := os.Getenv("SERVICE_URL")
	if serviceURL == "" {
		serviceURL = "http://localhost:8081"
	}
	target, err := url.Parse(serviceURL)
	if err != nil {
		log.Fatal("Invalid service URL")
	}
	log.Printf("Proxying to backend: %s", serviceURL)

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("PROXY ERROR: %v", err)
		w.WriteHeader(http.StatusBadGateway)
	}

	// Modify the director to fix the Host header
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
	}

	// The backend service applies its own CORS middleware too (so it works when hit directly,
	// e.g. in tests), which means a proxied response carries CORS headers from BOTH the
	// backend and this gateway's cors.New() above. httputil.ReverseProxy merges upstream
	// headers into the response via Header.Add (not Set), so the browser receives something
	// like "Access-Control-Allow-Origin: http://localhost:5173, http://localhost:5173" — a
	// multi-value header, which every browser correctly rejects as invalid, making every
	// cross-origin request (login included) fail with a CORS error. The gateway is the only
	// layer actually talking to the browser, so its own cors.New()-set headers are the ones
	// that matter; strip the backend's duplicate copies before they get merged in.
	proxy.ModifyResponse = func(res *http.Response) error {
		res.Header.Del("Access-Control-Allow-Origin")
		res.Header.Del("Access-Control-Allow-Credentials")
		res.Header.Del("Access-Control-Allow-Headers")
		res.Header.Del("Access-Control-Allow-Methods")
		return nil
	}

	r.Any("/api/*proxyPath", func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("PANIC in Proxy Handler: %v", r)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gateway Error", "details": fmt.Sprintf("%v", r)})
			}
		}()

		log.Printf("Proxying request to: %s %s", c.Request.Method, c.Request.URL.Path)

		// Check if this is a WebSocket upgrade request
		if isWebSocketUpgrade(c.Request) {
			log.Printf("WebSocket upgrade request detected, using WS proxy")
			proxyWebSocket(c.Writer, c.Request, target)
			return
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// Configurable gateway port
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Gateway running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to run gateway:", err)
	}
}

// getGatewayAllowedOrigins returns configurable CORS origins
func getGatewayAllowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		return []string{"http://localhost:3000", "http://localhost:5173"}
	}
	parts := strings.Split(origins, ",")
	var result []string
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// isWebSocketUpgrade checks if the HTTP request is a WebSocket upgrade
func isWebSocketUpgrade(r *http.Request) bool {
	return r.Header.Get("Upgrade") == "websocket"
}

// proxyWebSocket proxies WebSocket connections to the backend
func proxyWebSocket(w http.ResponseWriter, r *http.Request, target *url.URL) {
	// Build the backend WebSocket URL
	wsTarget := *r.URL
	wsTarget.Host = target.Host
	wsTarget.Scheme = "ws"
	if target.Scheme == "https" {
		wsTarget.Scheme = "wss"
	}

	log.Printf("Proxying WebSocket to: %s", wsTarget.String())

	// Use a custom reverse proxy that handles WebSocket
	wsProxy := httputil.NewSingleHostReverseProxy(target)
	wsProxy.Director = func(req *http.Request) {
		req.URL.Host = target.Host
		req.URL.Scheme = target.Scheme
		req.Host = target.Host
	}

	wsProxy.ServeHTTP(w, r)
}
