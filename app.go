package main

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	stdruntime "runtime"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

func (a *App) SelectFiles() []FileLink {
	selection, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择引用文件",
	})

	if err != nil || len(selection) == 0 {
		return []FileLink{}
	}

	var links []FileLink
	for _, path := range selection {
		links = append(links, FileLink{
			Path:      path,
			Name:      filepath.Base(path),
			Extension: filepath.Ext(path),
			IsFolder:  false,
		})
	}
	return links
}

func (a *App) SelectFolder() []FileLink {
	selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择引用文件夹",
	})

	if err != nil || selection == "" {
		return []FileLink{}
	}

	return []FileLink{{
		Path:      selection,
		Name:      filepath.Base(selection),
		Extension: "",
		IsFolder:  true,
	}}
}

func (a *App) OpenFile(path string) error {
	var cmd *exec.Cmd

	switch stdruntime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", path)
	case "darwin":
		cmd = exec.Command("open", path)
	default: // linux
		cmd = exec.Command("xdg-open", path)
	}
	
	return cmd.Start()
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