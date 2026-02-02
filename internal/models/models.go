package models

import (
	"strings"
	"time"
)

// Project represents a legal case/project
type Project struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Client    string     `json:"client"`
	Opponent  string     `json:"opponent"`
	Lawyer    string     `json:"lawyer"`
	Status    string     `json:"status"`
	Stage     string     `json:"stage"`
	Notes     string     `json:"notes"`
	Files     []FileLink `json:"files"`
	CreatedAt FlexTime   `json:"created_at"`
	SortOrder int        `json:"sort_order"`
}

// EnsureDefaults sets default values for a project
func (p *Project) EnsureDefaults() {
	if p.Status == "" {
		p.Status = "等待接手"
	}
	if p.CreatedAt.Time.IsZero() {
		p.CreatedAt = FlexTime{Time: time.Now()}
	}
}

// FileLink represents a reference to a file or folder
type FileLink struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Extension string `json:"extension"`
	IsFolder  bool   `json:"is_folder"`
}

// FlexTime is a time.Time that can parse multiple formats
type FlexTime struct {
	time.Time
}

// UnmarshalJSON implements custom JSON unmarshaling for FlexTime
func (ft *FlexTime) UnmarshalJSON(data []byte) error {
	// Remove quotes
	s := strings.Trim(string(data), "\"")
	if s == "" || s == "null" {
		ft.Time = time.Time{}
		return nil
	}

	// Try different formats
	formats := []string{
		time.RFC3339Nano,          // "2006-01-02T15:04:05.999999999Z07:00"
		time.RFC3339,              // "2006-01-02T15:04:05Z07:00"
		"2006-01-02T15:04:05",     // Without timezone (old format)
		"2006-01-02 15:04:05",     // Alternative format
		"2006-01-02",              // Date only
	}

	var parseErr error
	for _, format := range formats {
		t, err := time.ParseInLocation(format, s, time.Local)
		if err == nil {
			ft.Time = t
			return nil
		}
		parseErr = err
	}

	return parseErr
}

// MarshalJSON implements custom JSON marshaling for FlexTime
func (ft FlexTime) MarshalJSON() ([]byte, error) {
	if ft.Time.IsZero() {
		return []byte("null"), nil
	}
	return []byte("\"" + ft.Time.Format(time.RFC3339Nano) + "\""), nil
}
