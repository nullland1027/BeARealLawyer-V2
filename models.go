package main

import (
	"time"
)

type FileLink struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Extension string `json:"extension"`
	IsFolder  bool   `json:"is_folder"`
}

type Project struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Client    string     `json:"client"`
	Opponent  string     `json:"opponent"`
	Lawyer    string     `json:"lawyer"`
	Stage     string     `json:"stage"`
	Status    string     `json:"status"`
	SortOrder int        `json:"sort_order"`
	Notes     string     `json:"notes"`
	Files     []FileLink `json:"files"`
	CreatedAt string     `json:"created_at"`
	UpdatedAt string     `json:"updated_at"`
}

func (p *Project) EnsureDefaults() {
	if p.Status == "" {
		p.Status = "等待接手"
	}
	now := time.Now().Format(time.RFC3339)
	if p.CreatedAt == "" {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
}
