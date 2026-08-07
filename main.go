package main

import (
	"embed"
	"log"

	"github.com/Tangerg/planet_new/backend"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	shell := backend.New()

	app := application.New(application.Options{
		Name:     "PLANET",
		Services: shell.Services(),
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		// The composition root owns the native resources (SQLite catalog, media
		// server), so it — not the window — decides when they are released.
		OnShutdown: shell.Shutdown,
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "PLANET",
		Width:  1280,
		Height: 820,
		// 去掉原生标题栏/红绿灯,改由页面内 .win 自带的伪装窗口框 + 红绿灯充当窗口装饰,
		// 让整窗就是那张「沉浸式播放器」面板(与示例观感一致)。macOS 上 frameless
		// 仍沿用 AppKit 原生窗体(圆角/阴影不变),只是把系统按钮隐藏掉。
		Frameless:        true,
		BackgroundColour: application.NewRGB(8, 8, 11),
		URL:              "/",
	})

	if err := app.Run(); err != nil {
		log.Fatalln("Error:", err)
	}
}
