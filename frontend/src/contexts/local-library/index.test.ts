import { describe, expect, expectTypeOf, it } from "vitest";
import {
  LocalLibraryError,
  LocalLibraryErrorCode,
  LocalLibraryUnavailableError,
  localLibraryCall,
  toLocalLibraryError,
} from ".";
import type { LocalLibraryScanOutcome } from ".";

/** A rejection shaped the way Wails delivers a classified Go error. */
function bridgeRejection(code: string, operation: string): Error {
  return new Error(`local library ${operation} failed (${code})`, { cause: { code, operation } });
}

describe("Local Library Context public API", () => {
  it("exposes explicit scan outcomes", () => {
    expectTypeOf<LocalLibraryScanOutcome["status"]>().toEqualTypeOf<
      "cancelled" | "partial" | "complete" | "unavailable"
    >();
    expect(new LocalLibraryUnavailableError()).toHaveProperty(
      "name",
      "LocalLibraryUnavailableError",
    );
  });

  it("projects stable Wails errors without exposing backend cause text", async () => {
    const error = toLocalLibraryError(bridgeRejection("unavailable", "localLibrary.home"));
    expect(error).toBeInstanceOf(LocalLibraryError);
    expect(error).toMatchObject({
      code: LocalLibraryErrorCode.unavailable,
      operation: "localLibrary.home",
    });
    expect(error.message).not.toContain("sqlite");

    await expect(
      localLibraryCall(Promise.reject(bridgeRejection("cancelled", "localLibrary.scan"))),
    ).rejects.toMatchObject({ code: "cancelled", operation: "localLibrary.scan" });

    expect(
      toLocalLibraryError(bridgeRejection("invalidArgument", "localLibrary.albumDetail")),
    ).toMatchObject({ code: "invalidArgument", operation: "localLibrary.albumDetail" });
  });

  it("fails closed for anything that is not a classified payload", () => {
    const failed = { code: "failed", operation: "bridge" };
    // A transport failure: never reached Go, so it carries no cause at all.
    expect(toLocalLibraryError(new Error("Failed to fetch"))).toMatchObject(failed);
    // An unclassified Go error: Wails' default marshaller yields no payload.
    expect(toLocalLibraryError(new Error("boom", { cause: {} }))).toMatchObject(failed);
    // A code the frontend contract does not know must not be trusted through.
    expect(
      toLocalLibraryError(new Error("boom", { cause: { code: "teapot", operation: "x" } })),
    ).toMatchObject(failed);
    // Message text is never parsed, so a lookalike message proves nothing.
    expect(
      toLocalLibraryError(new Error('{"code":"unavailable","operation":"localLibrary.home"}')),
    ).toMatchObject(failed);
    expect(toLocalLibraryError("not an error at all")).toMatchObject(failed);
  });
});
