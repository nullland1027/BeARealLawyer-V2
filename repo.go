package main

import (
	"encoding/json"
	"os"
	"sort"
	"sync"
)

type Repository struct {
	filePath string
	mu       sync.Mutex
}

func NewRepository() *Repository {
	// Try to find the existing data file from the previous Python version
	// Assuming we are in a subdirectory of the original project
	path := "../data/projects.json"
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Fallback to local data directory
		path = "data/projects.json"
	}

	// Ensure directory exists if we are using the fallback
	if path == "data/projects.json" {
		os.MkdirAll("data", 0755)
	}

	return &Repository{
		filePath: path,
	}
}

func (r *Repository) Load() ([]Project, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, err := os.Stat(r.filePath); os.IsNotExist(err) {
		return []Project{}, nil
	}

	data, err := os.ReadFile(r.filePath)
	if err != nil {
		return nil, err
	}

	var projects []Project
	if err := json.Unmarshal(data, &projects); err != nil {
		// If JSON is invalid, return empty list logic or error
		return []Project{}, nil
	}

	// Sort by updated_at desc
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].UpdatedAt > projects[j].UpdatedAt
	})

	return projects, nil
}

func (r *Repository) Save(projects []Project) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	data, err := json.MarshalIndent(projects, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.filePath, data, 0644)
}
