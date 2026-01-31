package main

import (
	"encoding/json"
	"os"
	"sort"
	"sync"

	"github.com/google/uuid"
)

type Repository struct {
	filePath string
	mu       sync.Mutex
}

func NewRepository() *Repository {
	path := "data/projects.json"

	// Ensure directory exists
	os.MkdirAll("data", 0755)

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

	// Deduplicate IDs and ensure they exist
	seenIDs := make(map[string]bool)
	dirty := false
	for i := range projects {
		if projects[i].ID == "" || seenIDs[projects[i].ID] {
			projects[i].ID = uuid.New().String()
			dirty = true
		}
		seenIDs[projects[i].ID] = true
	}

	// If we fixed any IDs, save the corrected data back to disk immediately
	// using a direct internal save (ignoring the mutex since we hold it)
	if dirty {
		saveData, _ := json.MarshalIndent(projects, "", "  ")
		os.WriteFile(r.filePath, saveData, 0644)
	}

	// Sort by SortOrder asc, then updated_at desc
	sort.Slice(projects, func(i, j int) bool {
		if projects[i].SortOrder != projects[j].SortOrder {
			return projects[i].SortOrder < projects[j].SortOrder
		}
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
