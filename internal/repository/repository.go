package repository

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"be-a-real-lawyer-v2/internal/models"
)

// ProjectRepository handles project data persistence
type ProjectRepository struct {
	dataPath string
}

// NewProjectRepository creates a new repository instance
func NewProjectRepository() *ProjectRepository {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}

	dataDir := filepath.Join(homeDir, ".be-a-real-lawyer")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		fmt.Printf("Error creating data directory: %v\n", err)
	}

	return &ProjectRepository{
		dataPath: filepath.Join(dataDir, "projects.json"),
	}
}

// Load retrieves all projects from storage
func (r *ProjectRepository) Load() ([]models.Project, error) {
	data, err := os.ReadFile(r.dataPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.Project{}, nil
		}
		return nil, err
	}

	var projects []models.Project
	if err := json.Unmarshal(data, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

// Save persists all projects to storage
func (r *ProjectRepository) Save(projects []models.Project) error {
	data, err := json.MarshalIndent(projects, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.dataPath, data, 0644)
}

// FindByID finds a project by its ID
func (r *ProjectRepository) FindByID(id string) (*models.Project, error) {
	projects, err := r.Load()
	if err != nil {
		return nil, err
	}

	for _, p := range projects {
		if p.ID == id {
			return &p, nil
		}
	}

	return nil, nil
}

// Delete removes a project by ID
func (r *ProjectRepository) Delete(id string) error {
	projects, err := r.Load()
	if err != nil {
		return err
	}

	newProjects := make([]models.Project, 0, len(projects))
	for _, p := range projects {
		if p.ID != id {
			newProjects = append(newProjects, p)
		}
	}

	return r.Save(newProjects)
}

// Upsert creates or updates a project
func (r *ProjectRepository) Upsert(project models.Project) error {
	projects, err := r.Load()
	if err != nil {
		return err
	}

	found := false
	for i, p := range projects {
		if p.ID == project.ID {
			projects[i] = project
			found = true
			break
		}
	}

	if !found {
		projects = append([]models.Project{project}, projects...)
	}

	return r.Save(projects)
}
