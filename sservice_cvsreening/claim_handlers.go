package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

const maxClaimReceiptSizeMB = 5

var allowedClaimReceiptTypes = []string{"application/pdf", "image/jpeg", "image/png"}

// createClaimHandler lets an employee submit a self-service expense reimbursement claim.
// This replaces mobile's previous (incorrect) POST /benefits/allowances call — that endpoint
// creates HR-only allowance *catalog definitions* and would 403 for a plain employee; this is
// the real employee-facing claim submission endpoint, wired into the same generic Master
// Approval Engine every other module (overtime, leave, contract) already uses.
func createClaimHandler(c *gin.Context) {
	employeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return
	}

	claimType := c.PostForm("claimType")
	amountStr := c.PostForm("amount")
	description := c.PostForm("description")

	if claimType == "" || amountStr == "" {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "claimType dan amount wajib diisi", nil)
		return
	}
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		RespondWithError(c, http.StatusBadRequest, "invalid_amount", "Jumlah klaim tidak valid", nil)
		return
	}

	var receiptURL string
	file, header, ferr := c.Request.FormFile("receipt")
	if ferr == nil {
		defer file.Close()
		if err := ValidateFileSize(header.Size, maxClaimReceiptSizeMB); err != nil {
			RespondWithError(c, http.StatusBadRequest, "file_too_large", err.Error(), nil)
			return
		}
		contentType := header.Header.Get("Content-Type")
		if err := ValidateFileType(contentType, allowedClaimReceiptTypes); err != nil {
			RespondWithError(c, http.StatusBadRequest, "invalid_file_type", "Hanya file PDF/JPEG/PNG yang diperbolehkan", nil)
			return
		}

		uploadDir := filepath.Join("uploads", "claims", strconv.Itoa(employeeID))
		if err := os.MkdirAll(uploadDir, 0o755); err != nil {
			log.Printf("Failed to create claim upload dir: %v", err)
			RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menyimpan bukti klaim", nil)
			return
		}
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		destPath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(header, destPath); err != nil {
			log.Printf("Failed to save claim receipt: %v", err)
			RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menyimpan bukti klaim", nil)
			return
		}
		receiptURL = "/" + strings.ReplaceAll(destPath, "\\", "/")
	}

	id, err := repository.CreateClaim(c.Request.Context(), &models.Claim{
		EmployeeID:  employeeID,
		ClaimType:   claimType,
		Amount:      amount,
		Description: description,
		ReceiptURL:  receiptURL,
	})
	if err != nil {
		log.Printf("Failed to create claim: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat klaim", err.Error())
		return
	}

	summary := fmt.Sprintf("Klaim %s sebesar Rp %.0f", claimType, amount)
	approvalID, err := repository.SubmitApprovalRequest(c.Request.Context(), "claim_request", id, employeeID, summary)
	if err != nil {
		log.Printf("ERROR submitting claim %d for approval: %v", id, err)
		RespondWithError(c, http.StatusInternalServerError, "no_approval_flow",
			"Klaim dibuat, tapi belum ada approval flow aktif untuk modul claim_request", err.Error())
		return
	}
	notifyApprovalOutcome(c, approvalID, "", "")
	logAudit(c, "CLAIM_SUBMITTED", "claims", "claim", id)

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Klaim berhasil diajukan"})
}

// getMyClaimsHandler lists the caller's own claims — identity always resolved from the JWT,
// never a client-supplied employeeId.
func getMyClaimsHandler(c *gin.Context) {
	employeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return
	}
	claims, err := repository.GetClaimsByEmployeeID(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data klaim", err.Error())
		return
	}
	c.JSON(http.StatusOK, claims)
}
