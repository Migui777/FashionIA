import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCamera } from "./useCamera";

const originalMediaDevices = navigator.mediaDevices;

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: originalMediaDevices,
    configurable: true,
  });
  vi.restoreAllMocks();
});

describe("useCamera", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe("idle");
  });

  it("moves to granted when permission is accepted", async () => {
    const fakeTrack = { stop: vi.fn() };
    const fakeStream = { getTracks: () => [fakeTrack] } as unknown as MediaStream;

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.requestCamera();
    });

    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("moves to denied when permission is rejected", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException("no", "NotAllowedError")),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.requestCamera();
    });

    expect(result.current.status).toBe("denied");
  });

  it("reports unsupported browsers", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.requestCamera();
    });

    expect(result.current.status).toBe("unsupported");
  });
});
