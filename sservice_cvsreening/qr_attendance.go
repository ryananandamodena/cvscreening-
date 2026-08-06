package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const qrTokenValiditySeconds = 30

// generateQRToken creates a short-lived, tamper-proof token proving physical presence at the
// office kiosk. Format: "<unixTimestamp>.<hmacSignature>". The kiosk display refreshes this
// token every few seconds; an employee must scan it with their phone while it's still valid.
func generateQRToken() (string, int64) {
	issuedAt := time.Now().Unix()
	payload := strconv.FormatInt(issuedAt, 10)
	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(payload))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payload + "." + signature, issuedAt
}

// verifyQRToken checks the HMAC signature and that the token hasn't expired
func verifyQRToken(token string) error {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return fmt.Errorf("format QR token tidak valid")
	}
	payload, signature := parts[0], parts[1]

	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(payload))
	expectedSignature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return fmt.Errorf("QR token tidak valid atau telah dipalsukan")
	}

	issuedAt, err := strconv.ParseInt(payload, 10, 64)
	if err != nil {
		return fmt.Errorf("format QR token tidak valid")
	}
	if time.Now().Unix()-issuedAt > qrTokenValiditySeconds {
		return fmt.Errorf("QR code sudah kedaluwarsa, silakan scan ulang")
	}
	return nil
}

// getQRTokenHandler is polled by the kiosk display to keep rendering a fresh, rotating QR code
func getQRTokenHandler(c *gin.Context) {
	token, issuedAt := generateQRToken()
	c.JSON(http.StatusOK, gin.H{
		"token":            token,
		"issuedAt":         issuedAt,
		"expiresInSeconds": qrTokenValiditySeconds,
	})
}
