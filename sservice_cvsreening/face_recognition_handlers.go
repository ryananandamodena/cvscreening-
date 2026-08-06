package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// enrollFaceHandler saves the logged-in employee's reference face descriptor
func enrollFaceHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	var req struct {
		Descriptor []float64 `json:"descriptor" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if len(req.Descriptor) != 128 {
		RespondWithError(c, http.StatusBadRequest, "invalid_descriptor", "Face descriptor harus berisi 128 nilai", nil)
		return
	}

	if err := repository.SaveFaceDescriptor(c.Request.Context(), employeeID, req.Descriptor); err != nil {
		log.Printf("ERROR in enrollFaceHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menyimpan data wajah", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Face enrolled successfully"})
}

// getFaceEnrollmentStatusHandler tells the frontend whether the employee still needs to enroll
func getFaceEnrollmentStatusHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	descriptor, err := repository.GetFaceDescriptor(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil status pendaftaran wajah", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"enrolled": descriptor != nil})
}
