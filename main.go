package main

import (
	"embed"

	"changeme/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := backend.New()

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
		OnStartup:        app.Startup,
		Bind:             app.Bind(),
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
