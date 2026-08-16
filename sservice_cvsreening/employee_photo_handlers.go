package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	_ "golang.org/x/image/webp"
)

// ==================== EMPLOYEE PROFILE PHOTO ====================
//
// Module 15 — reuses the existing Employee.PhotoURL field (already present in the model/DB/
// frontend rendering, just never had a real upload flow behind it) and the same
// uploads/<subdir>/<generated-filename> + public /uploads static-serving pattern already used
// for interview recordings and contract signatures (interview_handlers.go, employee_handlers.go)
// — no new storage architecture introduced.
//
// Profile photo is deliberately kept separate from face enrollment (face_recognition_handlers.go /
// employees.face_descriptor): uploading a photo here NEVER touches face_descriptor, and enrolling
// a face NEVER touches photo_url. See Module 15 report §H/§U.

const maxPhotoSizeMB = 5
const maxPhotoDimension = 6000 // pixels per side — generous ceiling against decompression-bomb-style dimension abuse, not a normal photo's actual size

// sniffAndValidateImage reads the file's actual bytes (not the client-supplied Content-Type or
// filename/extension) to determine its real format via magic-byte sniffing, and sanity-checks
// declared dimensions without fully decoding pixel data. This is the backend-side validation the
// audit specifically requires — client-supplied Content-Type/extension are never trusted alone.
func sniffAndValidateImage(data []byte) (contentType string, err error) {
	detected := http.DetectContentType(data)
	switch detected {
	case "image/jpeg", "image/png", "image/webp":
		contentType = detected
	default:
		return "", fmt.Errorf("format file tidak didukung (terdeteksi: %s) — hanya JPEG, PNG, atau WebP yang diizinkan", detected)
	}

	cfg, _, decErr := image.DecodeConfig(bytes.NewReader(data))
	if decErr != nil {
		return "", fmt.Errorf("file gambar tidak valid atau rusak")
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width > maxPhotoDimension || cfg.Height > maxPhotoDimension {
		return "", fmt.Errorf("dimensi gambar tidak valid atau terlalu besar (maksimum %dx%d piksel)", maxPhotoDimension, maxPhotoDimension)
	}
	return contentType, nil
}

func extensionForContentType(contentType string) string {
	switch contentType {
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ".jpg"
	}
}

const employeePhotoUploadDir = "uploads/employees"

// savePhotoFile writes validated image bytes under a server-generated name — the client's
// filename is never used as (or part of) the storage path, so there is no path-traversal or
// overwrite-collision surface here (Module 15 §E/§W).
func savePhotoFile(employeeID int, contentType string, data []byte) (photoURL string, fullPath string, err error) {
	dir := fmt.Sprintf("%s/%d/profile", employeePhotoUploadDir, employeeID)
	if mkErr := os.MkdirAll(dir, 0755); mkErr != nil {
		return "", "", fmt.Errorf("failed to create upload directory: %w", mkErr)
	}
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), extensionForContentType(contentType))
	fullPath = fmt.Sprintf("%s/%s", dir, filename)
	if wErr := os.WriteFile(fullPath, data, 0644); wErr != nil {
		return "", "", fmt.Errorf("failed to write photo file: %w", wErr)
	}
	// Public URL served by the existing r.Static("/uploads", "./uploads") mount — same exposure
	// model already used for recordings/signatures; the employee directory itself already
	// returns photoUrl to any authenticated employee today (getEmployeesHandler), so this does
	// not newly expose anything beyond what the directory feature already does.
	photoURL = "/uploads/employees/" + strconv.Itoa(employeeID) + "/profile/" + filename
	return photoURL, fullPath, nil
}

// deletePhotoFileBestEffort removes a previously-stored photo file, tolerating "already gone".
// Never returns an error to the caller — losing an old file is not worth failing the request over.
func deletePhotoFileBestEffort(photoURL string) {
	if photoURL == "" {
		return
	}
	localPath := "." + photoURL // photoURL is always our own "/uploads/..." prefix, never client input
	if err := os.Remove(localPath); err != nil && !os.IsNotExist(err) {
		log.Printf("WARN: failed to remove old photo file %s: %v", localPath, err)
	}
}

func auditPhotoAction(c *gin.Context, action string, targetEmployeeID int) {
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     action,
		Module:     "employee_photo",
		EntityType: "employee",
		EntityID:   &targetEmployeeID,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})
}

// handleUploadPhoto is shared by the self-service and admin-target routes; targetEmployeeID is
// resolved by the caller (JWT-only for self, :id + route-level RecruiterOrAdmin gate for admin).
func handleUploadPhoto(c *gin.Context, targetEmployeeID int) {
	file, header, err := c.Request.FormFile("photo")
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "photo_required", "File foto diperlukan", nil)
		return
	}
	defer file.Close()

	if err := ValidateFileSize(header.Size, maxPhotoSizeMB); err != nil {
		RespondWithError(c, http.StatusBadRequest, "file_too_large", err.Error(), nil)
		return
	}

	data, err := io.ReadAll(io.LimitReader(file, int64(maxPhotoSizeMB)<<20+1))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "read_error", "Gagal membaca file", nil)
		return
	}

	contentType, err := sniffAndValidateImage(data)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_image", err.Error(), nil)
		return
	}

	existing, err := repository.GetEmployeeByID(c.Request.Context(), targetEmployeeID)
	if err != nil || existing == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Employee not found", nil)
		return
	}
	oldPhotoURL := existing.PhotoURL

	newPhotoURL, fullPath, err := savePhotoFile(targetEmployeeID, contentType, data)
	if err != nil {
		log.Printf("ERROR saving employee photo: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menyimpan foto", nil)
		return
	}

	if err := repository.UpdateEmployeePhotoURL(c.Request.Context(), targetEmployeeID, newPhotoURL); err != nil {
		// DB update failed — don't leave the just-written file orphaned.
		_ = os.Remove(fullPath)
		log.Printf("ERROR updating employee photo_url: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memperbarui data foto", nil)
		return
	}

	deletePhotoFileBestEffort(oldPhotoURL)
	auditPhotoAction(c, "photo_uploaded", targetEmployeeID)
	c.JSON(http.StatusOK, gin.H{"photoUrl": newPhotoURL, "updatedAt": time.Now().UTC()})
}

func handleDeletePhoto(c *gin.Context, targetEmployeeID int) {
	existing, err := repository.GetEmployeeByID(c.Request.Context(), targetEmployeeID)
	if err != nil || existing == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Employee not found", nil)
		return
	}
	if existing.PhotoURL == "" {
		c.JSON(http.StatusOK, gin.H{"message": "No photo to remove"})
		return
	}
	if err := repository.UpdateEmployeePhotoURL(c.Request.Context(), targetEmployeeID, ""); err != nil {
		log.Printf("ERROR clearing employee photo_url: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menghapus foto", nil)
		return
	}
	deletePhotoFileBestEffort(existing.PhotoURL)
	auditPhotoAction(c, "photo_deleted", targetEmployeeID)
	// Deleting a profile photo is unrelated to (and never touches) face_recognition enrollment —
	// SaveFaceDescriptor/GetFaceDescriptor are not called anywhere in this file.
	c.JSON(http.StatusOK, gin.H{"message": "Photo removed"})
}

// uploadMyPhotoHandler / deleteMyPhotoHandler — self-service, identity from JWT only.
func uploadMyPhotoHandler(c *gin.Context) {
	employeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return
	}
	handleUploadPhoto(c, employeeID)
}

func deleteMyPhotoHandler(c *gin.Context) {
	employeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return
	}
	handleDeletePhoto(c, employeeID)
}

// uploadEmployeePhotoHandler / deleteEmployeePhotoHandler — admin/recruiter managing another
// employee's photo; route-level RecruiterOrAdmin() gate (registered in routes_hr.go) is the
// authorization boundary here, matching how updateEmployeeHandler is already gated for every
// other employee field.
func uploadEmployeePhotoHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee id", nil)
		return
	}
	handleUploadPhoto(c, id)
}

func deleteEmployeePhotoHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee id", nil)
		return
	}
	handleDeletePhoto(c, id)
}
