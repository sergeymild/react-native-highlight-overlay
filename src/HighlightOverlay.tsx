import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RNHoleView } from "react-native-hole-view/src";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { viewHelpers } from "react-native-jsi-view-helpers";

import { useHighlightableElements } from "./context";
import type { Bounds } from "./context/context";

const DEFAULT_OVERLAY_STYLE: Required<OverlayStyle> = {
	color: "black",
	opacity: 0.7,
};

export type OverlayStyle = {
	/**
	 * The color of the overlay. Should not include alpha in the color, use `opacity` prop for that.
	 *
	 * @default "black"
	 * @since 1.3
	 */
	color?: string;

	/**
	 * The opacity of the overlay color.
	 *
	 * @default 0.7
	 * @since 1.3
	 */
	opacity?: number;
};

export type HighlightOverlayProps = {
	/**
	 * The id of the highlighted element. If `undefined`, `null`, or if the id does not exist,
	 * the overlay is hidden.
	 *
	 * @since 1.0
	 */
	highlightedElementId?: string | null;
	onHighlightElement?: (rect: { x: number; y: number; width: number; height: number }) => void;

	/**
	 * Called when the highlight is requesting to be dismissed. This is usually when the overlay
	 * (non-highlighted) part of the screen is pressed. The exact behavior is decided by each
	 * HighlightableElement.
	 *
	 * @since 1.0
	 */
	onDismiss: () => void;

	/**
	 * The style of the overlay.
	 *
	 * @default { color: "black", opacity: 0.7 }
	 * @since 1.3
	 */
	overlayStyle?: OverlayStyle;
};

/**
 * An overlay that optionally takes the id of a `HighlightableElement` to highlight
 * (exclude from the overlay). This is not a modal, so it should be placed on top of all elements
 * you want it to cover.
 *
 * **NOTE:** If the highlighted element is inside of a `ScrollView`, the `HighlightOverlay` should also
 * be inside of that scroll view to ensure that the highlight is correctly placed.
 *
 * @since 1.0
 */
const HighlightOverlay = React.memo(
	({
		highlightedElementId,
		onDismiss,
		overlayStyle = DEFAULT_OVERLAY_STYLE,
		onHighlightElement,
	}: HighlightOverlayProps) => {
		const [elements, { setCurrentActiveOverlay }] = useHighlightableElements();
		const [parentSize, setParentSize] = useState<Bounds | null>();
		const [nextBounds, setNextBounds] = useState<any>(null);

		const highlightedElementData = useMemo(
			() => (highlightedElementId != null ? elements[highlightedElementId] : null),
			[elements, highlightedElementId]
		);

		const hasContent = highlightedElementData != null && parentSize != null;
		const { color = DEFAULT_OVERLAY_STYLE.color, opacity = DEFAULT_OVERLAY_STYLE.opacity } =
			overlayStyle;

		useEffect(() => {
			setCurrentActiveOverlay(
				highlightedElementId == null ? null : { color, opacity, FadeIn, FadeOut, onDismiss }
			);
			// Dependency array should NOT include `onDismiss` prop
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [color, highlightedElementId, opacity, setCurrentActiveOverlay]);

		useEffect(() => {
			if (!hasContent) return;
			const next = elements[highlightedElementId as any];
			if (!next) return;
			(async function measure() {
				let count = 0;
				let bounds = viewHelpers.measureView(next.ref);
				while (
					bounds.width === 0 &&
					bounds.height === 0 &&
					bounds.x === 0 &&
					bounds.y === 0 &&
					count < 5
				) {
					await new Promise((resolve) => setTimeout(resolve, 50));
					count += 1;
					bounds = viewHelpers.measureView(next.ref);
				}
				setNextBounds(bounds);
				onHighlightElement?.(bounds);
			})();
		}, [elements, highlightedElementId, hasContent, onHighlightElement]);

		return (
			<View
				style={StyleSheet.absoluteFill}
				onLayout={({ nativeEvent: { layout } }) => setParentSize(layout)}
				pointerEvents="box-none"
				key={Math.round(1000).toString()}
			>
				{hasContent && nextBounds && (
					<View style={StyleSheet.absoluteFill}>
						<RNHoleView
							style={{
								position: "absolute",
								backgroundColor: color,
								opacity,
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
							}}
							holes={[
								{
									x: nextBounds.x,
									y: nextBounds.y,
									width: nextBounds.width,
									height: nextBounds.height,
									borderRadius: 4,
								},
							]}
						/>
					</View>
				)}
			</View>
		);
	},
	(prevProps, nextProps) =>
		// We need this here so we don't check the `onDismiss` prop.
		prevProps.highlightedElementId === nextProps.highlightedElementId &&
		prevProps.overlayStyle?.color === nextProps.overlayStyle?.color &&
		prevProps.overlayStyle?.opacity === nextProps.overlayStyle?.opacity &&
);
HighlightOverlay.displayName = "HighlightOverlay";
export default HighlightOverlay;
