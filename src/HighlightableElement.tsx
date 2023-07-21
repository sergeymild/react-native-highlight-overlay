import type { PropsWithChildren } from "react";
import React, { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity, View } from "react-native";

import { useHighlightableElements } from "./context";
import type { HighlightOptions } from "./context/context";

export type HighlightableElementProps = PropsWithChildren<{
	/**
	 * The id used by the HighlightOverlay to find this element.
	 * @since 1.0
	 */
	id: string;
	/**
	 * The options that decide how this element should look. If left undefined, it only highlights the element.
	 * @since 1.2
	 */
	options?: HighlightOptions;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
}>;

/**
 * A component that allows its children to be highlighted by the `HighlightOverlay` component.
 *
 * @since 1.0
 */
const HighlightableElement = React.memo(
	({ id, options, children, style, onPress }: HighlightableElementProps) => {
		const ref = useRef<TouchableOpacity>(null);

		const [_, { addElement, getRootRef, removeElement }] = useHighlightableElements();
		const rootRef = getRootRef();

		useEffect(() => {
			const refVal = ref.current;
			if (refVal == null || rootRef == null) {
				return;
			}

			addElement(id, ref, children, options);

			return () => {
				removeElement(id);
			};
			// We don't want to re-run this effect when addElement or removeElement changes.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [id, children, rootRef]);

		if (onPress != null) {
			return (
				<TouchableOpacity activeOpacity={1} ref={ref} style={style} onPress={onPress}>
					{children}
				</TouchableOpacity>
			);
		}

		return (
			<View collapsable={false} ref={ref} style={style}>
				{children}
			</View>
		);
	}
);
HighlightableElement.displayName = "HighlightableElement";
export default HighlightableElement;
