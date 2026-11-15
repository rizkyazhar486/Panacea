export interface MobileMinimalistDesignTokens {
  readonly brandMark: {
    readonly squircleSizePx: 40;
    readonly borderRadiusPx: 12;
    readonly vectorGlyphViewBox: "0 0 24 24";
    readonly opticalGapToWordmarkPx: 12;
  };
  readonly iconSystem: {
    readonly containerTouchTargetPx: 44;
    readonly badgeBoxSizePx: 32;
    readonly glyphSizePx: 18;
    readonly strokeWidthPx: 1.75;
    readonly rawEmojiBannedInPrimaryChrome: true;
  };
  readonly typographyScale: {
    readonly fontFamily: string;
    readonly numericVariant: "tabular-nums";
    readonly mobileHeroTitlePx: 20;
    readonly desktopHeroTitlePx: 26;
    readonly sectionHeaderPx: 14;
    readonly bodyCopyPx: 13;
    readonly microBadgePx: 11;
    readonly letterSpacingHeading: "-0.02em";
    readonly letterSpacingBadge: "0.06em";
  };
  readonly mobileViewport390x844Contract: {
    readonly outerPaddingPx: 16;
    readonly cardGapPx: 12;
    readonly cardInternalPaddingPx: 16;
    readonly cardBorderRadiusPx: 20;
    readonly ringGridColumnsMobile: 2;
    readonly ringGridColumnsDesktop: 4;
    readonly horizontalOverflowPermitted: false;
    readonly bottomNavHeightPx: 60;
  };
}

export function getCanonicalMobileMinimalistDesignTokens(): MobileMinimalistDesignTokens {
  return {
    brandMark: {
      squircleSizePx: 40,
      borderRadiusPx: 12,
      vectorGlyphViewBox: "0 0 24 24",
      opticalGapToWordmarkPx: 12
    },
    iconSystem: {
      containerTouchTargetPx: 44,
      badgeBoxSizePx: 32,
      glyphSizePx: 18,
      strokeWidthPx: 1.75,
      rawEmojiBannedInPrimaryChrome: true
    },
    typographyScale: {
      fontFamily: "-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif",
      numericVariant: "tabular-nums",
      mobileHeroTitlePx: 20,
      desktopHeroTitlePx: 26,
      sectionHeaderPx: 14,
      bodyCopyPx: 13,
      microBadgePx: 11,
      letterSpacingHeading: "-0.02em",
      letterSpacingBadge: "0.06em"
    },
    mobileViewport390x844Contract: {
      outerPaddingPx: 16,
      cardGapPx: 12,
      cardInternalPaddingPx: 16,
      cardBorderRadiusPx: 20,
      ringGridColumnsMobile: 2,
      ringGridColumnsDesktop: 4,
      horizontalOverflowPermitted: false,
      bottomNavHeightPx: 60
    }
  };
}

export function renderMonolineSvgIcon(
  iconId: "BRAND_CADUCEUS_INFINITY" | "HEART_PULSE" | "FLAME_METABOLIC" | "BRAIN_NEURO" | "BONE_ORTHO" | "SPARK_VITALITY" | "PIN_LOCATION" | "SHIELD_CHECK",
  strokeHex = "#38bdf8",
  sizePx = 18
): string {
  const paths: Record<typeof iconId, string> = {
    BRAND_CADUCEUS_INFINITY: "<path d=\"M12 3v18M8 7c2-2 6-2 8 0s-2 5-4 6-6 3-4 6 6 2 8 0\"/>",
    HEART_PULSE: "<path d=\"M3 12h4l2-5 4 10 2-5h6\"/>",
    FLAME_METABOLIC: "<path d=\"M12 3c3 4 6 7 6 11a6 6 0 1 1-12 0c0-4 3-7 6-11z\"/>",
    BRAIN_NEURO: "<circle cx=\"12\" cy=\"12\" r=\"7\"/><path d=\"M12 5v14M7 10h10M7 14h10\"/>",
    BONE_ORTHO: "<path d=\"M7 7l10 10M5 9a2 2 0 1 1 4-4 2 2 0 0 1-4 4zm10 10a2 2 0 1 1 4-4 2 2 0 0 1-4 4z\"/>",
    SPARK_VITALITY: "<path d=\"M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z\"/>",
    PIN_LOCATION: "<path d=\"M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z\"/><circle cx=\"12\" cy=\"11\" r=\"2\"/>",
    SHIELD_CHECK: "<path d=\"M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z\"/><path d=\"M9 12l2 2 4-4\"/>"
  };
  return "<svg width=\"" + sizePx + "\" height=\"" + sizePx + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"display:block;flex-shrink:0;\">" + paths[iconId] + "</svg>";
}