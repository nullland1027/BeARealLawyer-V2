package models

import "time"

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
	CreatedAt time.Time  `json:"created_at"`
	SortOrder int        `json:"sort_order"`
}

// EnsureDefaults sets default values for a project
func (p *Project) EnsureDefaults() {
	if p.Status == "" {
		p.Status = "等待接手"
	}
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
}

// FileLink represents a reference to a file or folder
type FileLink struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Extension string `json:"extension"`
	IsFolder  bool   `json:"is_folder"`
}
