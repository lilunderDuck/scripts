package native

import (
	"toast/backend/core/front2back"
	"toast/backend/debug"

	"github.com/ncruces/zenity"
)

type OpenFileDialogParam struct {
	Title  string                    `json:"title"`
	Filter []OpenDialogFilterOptions `json:"filter,omitempty"`
}

type OpenDialogFilterOptions struct {
	Name     string   `json:"name"`
	Patterns []string `json:"patterns"`
}

type OpenFileDialogResult struct {
	FilePath string `json:"filePath"`
}

func RegisterNativeDialogPickerCalls(windowHandle uintptr) {
	front2back.RegisterFn("openFileDialog", func(data *OpenFileDialogParam) (*OpenFileDialogResult, error) {
		fileFilters := zenity.FileFilters{}
		for i := 0; i < len(data.Filter); i++ {
			value := data.Filter[i]
			fileFilters = append(fileFilters, zenity.FileFilter{
				Name:     value.Name,
				Patterns: value.Patterns,
			})
		}

		filePath, err := zenity.SelectFile(
			zenity.Title(data.Title),
			fileFilters,
			zenity.Attach(windowHandle),
		)

		if err != nil {
			if err == zenity.ErrCanceled {
				if debug.IS_ENABLED {
					debug.WarnLabel("native", "user cancel the file dialog")
				}

				return nil, nil
			}

			return nil, err
		}

		return &OpenFileDialogResult{FilePath: filePath}, nil
	})
}
