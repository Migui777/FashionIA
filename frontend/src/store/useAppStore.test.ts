import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.setState({ dresses: [], detectedDressIds: [] });
  });

  it("adds a detected dress", () => {
    useAppStore.getState().addDetectedDress("dress-1");
    expect(useAppStore.getState().detectedDressIds).toEqual(["dress-1"]);
  });

  it("does not add the same dress twice", () => {
    useAppStore.getState().addDetectedDress("dress-1");
    useAppStore.getState().addDetectedDress("dress-1");
    expect(useAppStore.getState().detectedDressIds).toEqual(["dress-1"]);
  });

  it("resets detected dresses and selection", () => {
    useAppStore.getState().addDetectedDress("dress-1");
    useAppStore.getState().selectDress("dress-1");
    useAppStore.getState().reset();
    expect(useAppStore.getState().detectedDressIds).toEqual([]);
    expect(useAppStore.getState().selectedDressId).toBeNull();
  });
});
