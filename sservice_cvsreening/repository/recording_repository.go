package repository

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

// =====================================================
// RECORDING METADATA REPOSITORY
// =====================================================

// TranscriptSegment represents a transcript segment
type TranscriptSegment struct {
	ID         string  `json:"id"`
	Timestamp  float64 `json:"timestamp"`
	Duration   float64 `json:"duration"`
	Speaker    string  `json:"speaker"`
	Text       string  `json:"text"`
	Confidence float64 `json:"confidence"`
	Sentiment  string  `json:"sentiment,omitempty"`
}

// RecordingAIAnalysis represents AI analysis of a recording
type RecordingAIAnalysis struct {
	OverallScore       float64  `json:"overallScore"`
	CommunicationScore float64  `json:"communicationScore"`
	TechnicalScore     float64  `json:"technicalScore"`
	SentimentScore     float64  `json:"sentimentScore"`
	Keywords           []string `json:"keywords"`
	Topics             []string `json:"topics"`
	Recommendations    []string `json:"recommendations"`
}

// RecordingMeta represents a recording metadata record
type RecordingMeta struct {
	ID            int                  `json:"id"`
	InterviewID   int                  `json:"interviewId"`
	CandidateID   *int                 `json:"candidateId"`
	CandidateName string               `json:"candidateName"`
	FilePath      string               `json:"filePath"`
	FileSize      int64                `json:"fileSize"`
	DurationSecs  int                  `json:"durationSeconds"`
	Format        string               `json:"format"`
	RecordingType string               `json:"recordingType"`
	Status        string               `json:"status"`
	ThumbnailURL  string               `json:"thumbnailUrl"`
	Transcript    []TranscriptSegment  `json:"transcript"`
	AIAnalysis    *RecordingAIAnalysis `json:"aiAnalysis"`
	CreatedAt     time.Time            `json:"createdAt"`
	UpdatedAt     time.Time            `json:"updatedAt"`
}

func CreateRecordingMeta(ctx context.Context, rec *RecordingMeta) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	transcriptJSON, _ := json.Marshal(rec.Transcript)
	analysisJSON, _ := json.Marshal(rec.AIAnalysis)

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO recording_metadata (interview_id, candidate_id, candidate_name, file_path, file_size, 
		       duration_seconds, format, recording_type, status, thumbnail_url, transcript, ai_analysis)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`, rec.InterviewID, rec.CandidateID, rec.CandidateName, rec.FilePath, rec.FileSize,
		rec.DurationSecs, rec.Format, rec.RecordingType, rec.Status, rec.ThumbnailURL,
		transcriptJSON, analysisJSON).Scan(&id)

	if err != nil {
		log.Printf("Failed to create recording metadata: %v", err)
		return 0, err
	}
	return id, nil
}

func GetRecordingsByInterviewID(ctx context.Context, interviewID int) ([]RecordingMeta, error) {
	if !IsDBConnected() {
		return []RecordingMeta{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, interview_id, candidate_id, COALESCE(candidate_name, ''), COALESCE(file_path, ''),
		       COALESCE(file_size, 0), COALESCE(duration_seconds, 0), COALESCE(format, 'webm'),
		       COALESCE(recording_type, 'video'), COALESCE(status, 'completed'),
		       COALESCE(thumbnail_url, ''), transcript, ai_analysis, created_at, updated_at
		FROM recording_metadata
		WHERE interview_id = $1
		ORDER BY created_at DESC
	`, interviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recordings []RecordingMeta
	for rows.Next() {
		var rec RecordingMeta
		var transcriptJSON, analysisJSON []byte
		err := rows.Scan(
			&rec.ID, &rec.InterviewID, &rec.CandidateID, &rec.CandidateName, &rec.FilePath,
			&rec.FileSize, &rec.DurationSecs, &rec.Format, &rec.RecordingType, &rec.Status,
			&rec.ThumbnailURL, &transcriptJSON, &analysisJSON, &rec.CreatedAt, &rec.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning recording: %v", err)
			continue
		}
		if transcriptJSON != nil {
			json.Unmarshal(transcriptJSON, &rec.Transcript)
		}
		if analysisJSON != nil {
			json.Unmarshal(analysisJSON, &rec.AIAnalysis)
		}
		recordings = append(recordings, rec)
	}

	return recordings, nil
}

func GetRecordingByID(ctx context.Context, id int) (*RecordingMeta, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var rec RecordingMeta
	var transcriptJSON, analysisJSON []byte

	err := GetDB().QueryRow(ctx, `
		SELECT id, interview_id, candidate_id, COALESCE(candidate_name, ''), COALESCE(file_path, ''),
		       COALESCE(file_size, 0), COALESCE(duration_seconds, 0), COALESCE(format, 'webm'),
		       COALESCE(recording_type, 'video'), COALESCE(status, 'completed'),
		       COALESCE(thumbnail_url, ''), transcript, ai_analysis, created_at, updated_at
		FROM recording_metadata
		WHERE id = $1
	`, id).Scan(
		&rec.ID, &rec.InterviewID, &rec.CandidateID, &rec.CandidateName, &rec.FilePath,
		&rec.FileSize, &rec.DurationSecs, &rec.Format, &rec.RecordingType, &rec.Status,
		&rec.ThumbnailURL, &transcriptJSON, &analysisJSON, &rec.CreatedAt, &rec.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if transcriptJSON != nil {
		json.Unmarshal(transcriptJSON, &rec.Transcript)
	}
	if analysisJSON != nil {
		json.Unmarshal(analysisJSON, &rec.AIAnalysis)
	}

	return &rec, nil
}

func DeleteRecording(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, "DELETE FROM recording_metadata WHERE id = $1", id)
	if err != nil {
		log.Printf("Failed to delete recording: %v", err)
		return err
	}
	return nil
}
