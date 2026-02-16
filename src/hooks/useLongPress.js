"use client";

import { useCallback, useRef, useState } from "react";

export default function useLongPress(
  onLongPress,
  onClick,
  { threshold = 500, onStart = () => {}, onFinish = () => {}, onCancel = () => {} } = {}
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef();
  const target = useRef();

  const start = useCallback(
    (event) => {
      onStart(event);
      target.current = event.target;
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
        onFinish(event);
      }, threshold);
    },
    [onLongPress, threshold, onStart, onFinish]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      if (longPressTriggered) {
        onCancel(event);
      } else if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }
      setLongPressTriggered(false);
      target.current = null;
    },
    [onClick, longPressTriggered, onCancel]
  );

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e),
  };
}
