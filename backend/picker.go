package backend

import (
	"context"
	"errors"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// wailsFolderPicker implements application.FolderPicker with the native Wails
// directory dialog. It needs the runtime context, captured at startup — the one
// spot the Wails runtime touches the folder-choice use case.
type wailsFolderPicker struct {
	ctx context.Context
}

func (p *wailsFolderPicker) attach(ctx context.Context) { p.ctx = ctx }

func (p *wailsFolderPicker) Pick() (string, error) {
	if p.ctx == nil {
		return "", errors.New("runtime not ready")
	}
	return wailsruntime.OpenDirectoryDialog(p.ctx, wailsruntime.OpenDialogOptions{
		Title: "选择音乐文件夹",
	})
}
