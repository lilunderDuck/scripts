package main

import "github.com/ncruces/zenity"

type OpenFileDialogParam struct {
	Title  string                    `json:"title"`
	Filter []OpenDialogFilterOptions `json:"filter,omitempty"`
}

type OpenDialogFilterOptions struct {
	Name     string   `json:"name"`
	Patterns []string `json:"patterns"`
}

func openFileDialog(options *OpenFileDialogParam, windowHandle uintptr) (string, error) {
	fileFilters := zenity.FileFilters{}
	for i := 0; i < len(options.Filter); i++ {
		value := options.Filter[i]
		fileFilters = append(fileFilters, zenity.FileFilter{
			Name:     value.Name,
			Patterns: value.Patterns,
		})
	}

	filePath, err := zenity.SelectFile(
		zenity.Title(options.Title),
		fileFilters,
		zenity.Attach(windowHandle),
	)

	if err != nil {
		if err == zenity.ErrCanceled {
			return "", nil
		}

		return "", err
	}

	return filePath, nil
}
