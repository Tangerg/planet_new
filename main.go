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
	// Declared up front so the single-instance handler can reach the window it
	// has to raise. The shell owns exactly one window, and it is assigned below
	// before a second launch could possibly arrive.
	var window *application.WebviewWindow

	app := application.New(application.Options{
		Name: "PLANET",
		// Shown in the About box of the menu v3 installs by default — which is
		// also what keeps Cmd+Q/W and clipboard shortcuts alive in a window that
		// has no chrome of its own.
		Description: "沉浸式桌面音乐播放器",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		// One process owns the on-device library. A second launch would open the
		// same SQLite file and bind its own media server, and two scanners could
		// then write the same catalog — so the second instance hands over to the
		// first and exits instead.
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "com.tangerg.planet",
			OnSecondInstanceLaunch: func(application.SecondInstanceData) {
				// Raise the window we own rather than asking which one is
				// current: "current" resolves to the key window, and an app
				// that is minimised — precisely when a relaunch is most likely
				// — has none, so that lookup would hand back nothing to raise.
				if window == nil {
					return
				}
				// Un-minimise first: the launcher activates the app for us, but
				// macOS leaves a minimised window in the Dock when it does.
				window.UnMinimise()
				window.Focus()
			},
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Past the single-instance gate, so this process is the one that owns the
	// library: only now is it safe to open the catalog and bind the media server.
	// Constructing the shell earlier would have a losing second instance acquire
	// both and drop them again on the way out.
	shell := backend.New()
	for _, service := range shell.Services() {
		app.RegisterService(service)
	}
	// The composition root owns the native resources, so it — not the window —
	// decides when they are released.
	app.OnShutdown(shell.Shutdown)

	window = app.Window.NewWithOptions(application.WebviewWindowOptions{
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
