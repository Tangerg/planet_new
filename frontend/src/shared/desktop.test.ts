import { afterEach, describe, expect, it } from "vitest";
import { isDesktopShell } from "./desktop";

type MutableWindow = Record<string, unknown>;

function set(key: string, value: unknown): void {
  (window as unknown as MutableWindow)[key] = value;
}

afterEach(() => {
  for (const key of ["_wails", "chrome", "webkit"]) {
    delete (window as unknown as MutableWindow)[key];
  }
});

describe("isDesktopShell", () => {
  it("is false in a plain browser page", () => {
    expect(isDesktopShell()).toBe(false);
  });

  it("trusts the injected runtime config once Go has published it", () => {
    set("_wails", { environment: { OS: "darwin" } });
    expect(isDesktopShell()).toBe(true);
  });

  it("rejects a non-desktop platform reported by the runtime config", () => {
    set("_wails", { environment: { OS: "android" } });
    expect(isDesktopShell()).toBe(false);
  });

  it("falls back to the platform IPC handle before the config is injected", () => {
    set("webkit", { messageHandlers: { external: {} } });
    expect(isDesktopShell()).toBe(true);
    set("webkit", undefined);
    set("chrome", { webview: {} });
    expect(isDesktopShell()).toBe(true);
  });

  it("ignores the IPC handle once the config says this is not a desktop shell", () => {
    set("_wails", { environment: { OS: "ios" } });
    set("webkit", { messageHandlers: { external: {} } });
    expect(isDesktopShell()).toBe(false);
  });
});
