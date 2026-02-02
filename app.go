package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"be-a-real-lawyer-v2/internal/handlers"
	"be-a-real-lawyer-v2/internal/models"
	"be-a-real-lawyer-v2/internal/repository"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

// ImportProjectsFromFile opens a file dialog and imports projects from selected JSON file
func (a *App) ImportProjectsFromFile() (int, error) {
	fmt.Println("ImportProjectsFromFile called")
	
	// Open file dialog to select JSON file
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择要导入的数据文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})

	if err != nil {
		fmt.Printf("File dialog error: %v\n", err)
		return 0, fmt.Errorf("打开文件对话框失败: %w", err)
	}
	
	if selection == "" {
		fmt.Println("User cancelled file selection")
		return 0, nil // User cancelled
	}
	
	fmt.Printf("Selected file: %s\n", selection)

	// Read file content
	data, err := os.ReadFile(selection)
	if err != nil {
		fmt.Printf("Read file error: %v\n", err)
		return 0, fmt.Errorf("读取文件失败: %w", err)
	}
	
	fmt.Printf("File read successfully, size: %d bytes\n", len(data))

	// Parse JSON
	var projects []models.Project
	if err := json.Unmarshal(data, &projects); err != nil {
		fmt.Printf("JSON parse error: %v\n", err)
		return 0, fmt.Errorf("解析JSON失败: %w", err)
	}
	
	fmt.Printf("Parsed %d projects from file\n", len(projects))

	// Import projects
	count, err := a.projectHandler.ImportProjects(projects)
	if err != nil {
		fmt.Printf("Import error: %v\n", err)
		return 0, fmt.Errorf("导入失败: %w", err)
	}

	fmt.Printf("Successfully imported %d projects\n", count)
	return count, nil
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
