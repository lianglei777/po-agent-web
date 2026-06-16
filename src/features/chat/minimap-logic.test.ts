import { describe, expect, it } from "vitest";
import {
  computeMessageTopRatio,
  computeTooltipPositions,
  computeViewportGeometry,
  dragOffsetForPointer,
  findNearestNode,
  scrollTopForViewportRatio,
} from "./minimap-logic";

describe("chat minimap geometry", () => {
  it("hides short conversations and reports a full viewport", () => {
    expect(
      computeViewportGeometry({
        clientHeight: 490,
        scrollHeight: 500,
        scrollTop: 0,
      }),
    ).toEqual({
      scrollRatio: 0,
      viewportRatio: 0.98,
      viewportTopRatio: 0,
      visible: false,
    });
  });

  it("uses max scroll for scrollRatio and total height for viewportRatio", () => {
    expect(
      computeViewportGeometry({
        clientHeight: 500,
        scrollHeight: 2000,
        scrollTop: 750,
      }),
    ).toEqual({
      scrollRatio: 0.5,
      viewportRatio: 0.25,
      viewportTopRatio: 0.375,
      visible: true,
    });
  });

  it("aligns the viewport rectangle at the bottom", () => {
    expect(
      computeViewportGeometry({
        clientHeight: 500,
        scrollHeight: 2000,
        scrollTop: 1500,
      }).viewportTopRatio,
    ).toBe(0.75);
  });

  it("maps DOM viewport coordinates back into content coordinates", () => {
    expect(
      computeMessageTopRatio({
        containerTop: 100,
        elementTop: 250,
        scrollHeight: 1000,
        scrollTop: 300,
      }),
    ).toBe(0.45);
  });

  it("converts minimap viewport top ratios to scrollTop", () => {
    expect(
      scrollTopForViewportRatio({
        clientHeight: 500,
        scrollHeight: 2000,
        viewportRatio: 0.25,
        viewportTopRatio: 0.375,
      }),
    ).toBe(750);
    expect(
      scrollTopForViewportRatio({
        clientHeight: 500,
        scrollHeight: 2000,
        viewportRatio: 0.25,
        viewportTopRatio: 1,
      }),
    ).toBe(1500);
  });

  it("keeps the grab offset inside the current viewport", () => {
    expect(
      dragOffsetForPointer({
        pointerRatio: 0.45,
        scrollRatio: 0.5,
        viewportRatio: 0.25,
      }),
    ).toBeCloseTo(0.075);
    expect(
      dragOffsetForPointer({
        pointerRatio: 0.05,
        scrollRatio: 0.5,
        viewportRatio: 0.25,
      }),
    ).toBe(0.125);
  });
});

describe("chat minimap nearest node", () => {
  const nodes = [
    { index: 0, topRatio: 0.25 },
    { index: 1, topRatio: 0.75 },
  ];

  it("returns null without nodes or mouse position", () => {
    expect(findNearestNode([], 0.5)).toBeNull();
    expect(findNearestNode(nodes, null)).toBeNull();
  });

  it("finds the closest node and keeps the earlier node on ties", () => {
    expect(findNearestNode(nodes, 0.76)).toBe(1);
    expect(findNearestNode(nodes, 0.5)).toBe(0);
  });
});

describe("chat minimap tooltip positions", () => {
  it("centers a single tooltip on its node and clamps to bounds", () => {
    expect(computeTooltipPositions([{ topRatio: 0.5 }], 200)).toEqual([89]);
    expect(computeTooltipPositions([{ topRatio: 0 }], 200)).toEqual([0]);
    expect(computeTooltipPositions([{ topRatio: 1 }], 200)).toEqual([178]);
  });

  it("keeps ordinary-density tooltips separated by the configured gap", () => {
    const positions = computeTooltipPositions(
      [{ topRatio: 0.1 }, { topRatio: 0.12 }, { topRatio: 0.14 }],
      200,
    );

    expect(positions[1] - positions[0]).toBeGreaterThanOrEqual(24);
    expect(positions[2] - positions[1]).toBeGreaterThanOrEqual(24);
  });

  it("uses ten bidirectional passes and clamps crowded edges", () => {
    const positions = computeTooltipPositions(
      [
        { topRatio: 0.94 },
        { topRatio: 0.95 },
        { topRatio: 0.96 },
        { topRatio: 0.97 },
      ],
      80,
    );

    expect(positions.at(-1)).toBe(58);
    expect(positions.every((position) => position >= 0 && position <= 58)).toBe(
      true,
    );
  });
});
