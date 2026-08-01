import { describe, expect, expectTypeOf, it } from "vitest";
import {
  LocalLibraryError,
  LocalLibraryErrorCode,
  LocalLibraryUnavailableError,
  localLibraryCall,
  toLocalLibraryError,
} from ".";
import type { LocalLibraryLookupStatus, LocalLibraryScanOutcome } from ".";

describe("Local Library Context public API", () => {
  it("exposes explicit lookup and scan outcomes", () => {
    expectTypeOf<LocalLibraryLookupStatus>().toEqualTypeOf<"found" | "notFound">();
    expectTypeOf<LocalLibraryScanOutcome["status"]>().toEqualTypeOf<
      "cancelled" | "partial" | "complete" | "unavailable"
    >();
    expect(new LocalLibraryUnavailableError()).toHaveProperty(
      "name",
      "LocalLibraryUnavailableError",
    );
  });

  it("projects stable Wails errors without exposing backend cause text", async () => {
    const error = toLocalLibraryError(
      new Error('PLANET_ERROR:{"code":"unavailable","operation":"localLibrary.home"}'),
    );
    expect(error).toBeInstanceOf(LocalLibraryError);
    expect(error).toMatchObject({
      code: LocalLibraryErrorCode.unavailable,
      operation: "localLibrary.home",
    });
    expect(error.message).not.toContain("sqlite");

    await expect(
      localLibraryCall(
        Promise.reject(
          new Error('PLANET_ERROR:{"code":"cancelled","operation":"localLibrary.scan"}'),
        ),
      ),
    ).rejects.toMatchObject({ code: "cancelled", operation: "localLibrary.scan" });

    expect(
      toLocalLibraryError(
        new Error('PLANET_ERROR:{"code":"invalidArgument","operation":"localLibrary.albumDetail"}'),
      ),
    ).toMatchObject({ code: "invalidArgument", operation: "localLibrary.albumDetail" });
  });

  it("fails closed when a bridge error is malformed", () => {
    expect(toLocalLibraryError(new Error("raw sqlite failure"))).toMatchObject({
      code: "failed",
      operation: "bridge",
    });
  });
});
