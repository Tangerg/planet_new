package main

import (
	"context"
	"embed"

	"changeme/library"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()
	// On-device music library (folder scan + SQLite + loopback media server),
	// bound so the frontend `LocalMusic` provider can reach it over the JS bridge.
	lib := library.New()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "PLANET",
		Width:  1280,
		Height: 820,
		// 去掉原生标题栏/红绿灯,改由页面内 .win 自带的伪装窗口框 + 红绿灯充当窗口装饰,
		// 让整窗就是那张「沉浸式播放器」面板(与示例观感一致)。
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 8, G: 8, B: 11, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			library.Attach(ctx, lib)
		},
		Bind: []interface{}{
			app,
			lib,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
