package handlers

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	stdruntime "runtime"

	"be-a-real-lawyer-v2/internal/models"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// FileHandler handles file-related operations
type FileHandler struct {
	ctx context.Context
}

// NewFileHandler creates a new file handler
func NewFileHandler() *FileHandler {
	return &FileHandler{}
}

// SetContext sets the wails context
func (h *FileHandler) SetContext(ctx context.Context) {
	h.ctx = ctx
}

// SelectFiles opens a file selection dialog
func (h *FileHandler) SelectFiles() []models.FileLink {
	selection, err := runtime.OpenMultipleFilesDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择引用文件",
	})

	if err != nil || len(selection) == 0 {
		return []models.FileLink{}
	}

	var links []models.FileLink
	for _, path := range selection {
		links = append(links, models.FileLink{
			Path:      path,
			Name:      filepath.Base(path),
			Extension: filepath.Ext(path),
			IsFolder:  false,
		})
	}
	return links
}

// SelectFolder opens a folder selection dialog
func (h *FileHandler) SelectFolder() []models.FileLink {
	selection, err := runtime.OpenDirectoryDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择引用文件夹",
	})

	if err != nil || selection == "" {
		return []models.FileLink{}
	}

	return []models.FileLink{{
		Path:      selection,
		Name:      filepath.Base(selection),
		Extension: "",
		IsFolder:  true,
	}}
}

// OpenFile opens a file or folder with the system default application
func (h *FileHandler) OpenFile(path string) error {
	// Check if file/folder exists first
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("文件或文件夹不存在: %s", filepath.Base(path))
	}

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

// CheckPath returns file info for a given path
func (h *FileHandler) CheckPath(path string) models.FileLink {
	fmt.Printf("Backend CheckPath called with: %s\n", path)

	info, err := os.Stat(path)
	if err != nil {
		return models.FileLink{}
	}

	return models.FileLink{
		Path:      path,
		Name:      info.Name(),
		Extension: filepath.Ext(path),
		IsFolder:  info.IsDir(),
	}
}
