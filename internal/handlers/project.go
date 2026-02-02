package handlers

import (
	"context"
	"fmt"

	"be-a-real-lawyer-v2/internal/models"
	"be-a-real-lawyer-v2/internal/repository"

	"github.com/google/uuid"
)

// ProjectHandler handles project-related operations
type ProjectHandler struct {
	repo *repository.ProjectRepository
}

// NewProjectHandler creates a new project handler
func NewProjectHandler(repo *repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

// GetProjects returns all projects
func (h *ProjectHandler) GetProjects() []models.Project {
	projects, err := h.repo.Load()
	if err != nil {
		fmt.Printf("Error loading projects: %v\n", err)
		return []models.Project{}
	}
	return projects
}

// SaveProject creates or updates a project
func (h *ProjectHandler) SaveProject(p models.Project) models.Project {
	p.EnsureDefaults()
	if p.ID == "" {
		p.ID = uuid.New().String()
	}

	if err := h.repo.Upsert(p); err != nil {
		fmt.Printf("Error saving project: %v\n", err)
	}

	return p
}

// DeleteProject removes a project by ID
func (h *ProjectHandler) DeleteProject(id string) bool {
	if err := h.repo.Delete(id); err != nil {
		fmt.Printf("Error deleting project: %v\n", err)
		return false
	}
	return true
}

// UpdateProjects updates all projects (for reordering)
func (h *ProjectHandler) UpdateProjects(projects []models.Project) bool {
	if err := h.repo.Save(projects); err != nil {
		fmt.Printf("Error updating projects: %v\n", err)
		return false
	}
	return true
}

// DeleteAllProjects removes all projects
func (h *ProjectHandler) DeleteAllProjects() int {
	projects, _ := h.repo.Load()
	count := len(projects)
	h.repo.Save([]models.Project{})
	return count
}

// SetContext is a placeholder for wails context (not used here but may be needed)
func (h *ProjectHandler) SetContext(ctx context.Context) {
	// Reserved for future use
}
