package main

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx  context.Context
	repo *Repository
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		repo: NewRepository(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetProjects() []Project {
	projects, err := a.repo.Load()
	if err != nil {
		fmt.Printf("Error loading projects: %v\n", err)
		return []Project{}
	}
	return projects
}

func (a *App) SaveProject(p Project) Project {
	p.EnsureDefaults()
	if p.ID == "" {
		p.ID = uuid.New().String()
	}

	projects, _ := a.repo.Load()
	
	// Check if update or create
	found := false
	for i, existing := range projects {
		if existing.ID == p.ID {
			projects[i] = p
			found = true
			break
		}
	}
	if !found {
		projects = append([]Project{p}, projects...)
	}

	a.repo.Save(projects)
	return p
}

func (a *App) DeleteProject(id string) bool {
	projects, _ := a.repo.Load()
	newProjects := []Project{}
	for _, p := range projects {
		if p.ID != id {
			newProjects = append(newProjects, p)
		}
	}
	
	if len(newProjects) == len(projects) {
		return false
	}
	
	a.repo.Save(newProjects)
	return true
}

func (a *App) DeleteAllProjects() int {
	projects, _ := a.repo.Load()
	count := len(projects)
	a.repo.Save([]Project{})
	return count
}

func (a *App) UpdateProjects(projects []Project) bool {
	err := a.repo.Save(projects)
	return err == nil
}