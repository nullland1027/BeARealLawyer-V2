package main

import (
	"context"

	"be-a-real-lawyer-v2/internal/handlers"
	"be-a-real-lawyer-v2/internal/models"
	"be-a-real-lawyer-v2/internal/repository"
)

// App struct - main application structure that binds to frontend
type App struct {
	ctx            context.Context
	projectHandler *handlers.ProjectHandler
	fileHandler    *handlers.FileHandler
}

// NewApp creates a new App application struct
func NewApp() *App {
	repo := repository.NewProjectRepository()
	return &App{
		projectHandler: handlers.NewProjectHandler(repo),
		fileHandler:    handlers.NewFileHandler(),
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.fileHandler.SetContext(ctx)
}

// --- Project Methods (exposed to frontend) ---

// GetProjects returns all projects
func (a *App) GetProjects() []models.Project {
	return a.projectHandler.GetProjects()
}

// SaveProject creates or updates a project
func (a *App) SaveProject(p models.Project) models.Project {
	return a.projectHandler.SaveProject(p)
}

// DeleteProject removes a project by ID
func (a *App) DeleteProject(id string) bool {
	return a.projectHandler.DeleteProject(id)
}

// UpdateProjects updates all projects (for reordering)
func (a *App) UpdateProjects(projects []models.Project) bool {
	return a.projectHandler.UpdateProjects(projects)
}

// DeleteAllProjects removes all projects
func (a *App) DeleteAllProjects() int {
	return a.projectHandler.DeleteAllProjects()
}

// --- File Methods (exposed to frontend) ---

// SelectFiles opens a file selection dialog
func (a *App) SelectFiles() []models.FileLink {
	return a.fileHandler.SelectFiles()
}

// SelectFolder opens a folder selection dialog
func (a *App) SelectFolder() []models.FileLink {
	return a.fileHandler.SelectFolder()
}

// OpenFile opens a file or folder with the system default application
func (a *App) OpenFile(path string) error {
	return a.fileHandler.OpenFile(path)
}

// CheckPath returns file info for a given path
func (a *App) CheckPath(path string) models.FileLink {
	return a.fileHandler.CheckPath(path)
}
