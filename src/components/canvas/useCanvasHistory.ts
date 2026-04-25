import { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

export function useCanvasHistory(canvas: fabric.Canvas | null, maxSize: number = 50) {
    const history = useRef<any[]>([]);
    const historyIndex = useRef(-1);
    const isUndoRedoAction = useRef(false);
    const [updater, setUpdater] = useState(0); // Trigger re-renders for UI button states

    const initHistory = useCallback(() => {
        if (!canvas) return;
        const initial = canvas.toJSON(['data']);
        history.current = [initial];
        historyIndex.current = 0;
        setUpdater(v => v + 1);
    }, [canvas]);

    const saveHistory = useCallback(() => {
        if (!canvas || isUndoRedoAction.current) return;

        try {
            const state = canvas.toJSON(['data']);

            // Trim future history if we're saving over an undone state
            history.current = history.current.slice(0, historyIndex.current + 1);
            history.current.push(state);

            if (history.current.length > maxSize) {
                history.current.shift();
            } else {
                historyIndex.current += 1;
            }

            setUpdater(v => v + 1);
        } catch (e) {
            console.error("History stack overflow", e);
        }
    }, [canvas, maxSize]);

    const undo = useCallback(() => {
        if (!canvas || historyIndex.current <= 0) return;
        isUndoRedoAction.current = true;

        const targetIdx = historyIndex.current - 1;
        canvas.loadFromJSON(history.current[targetIdx], () => {
            canvas.renderAll();
            historyIndex.current = targetIdx;
            isUndoRedoAction.current = false;
            setUpdater(v => v + 1);
        });
    }, [canvas]);

    const redo = useCallback(() => {
        if (!canvas || historyIndex.current >= history.current.length - 1) return;
        isUndoRedoAction.current = true;

        const targetIdx = historyIndex.current + 1;
        canvas.loadFromJSON(history.current[targetIdx], () => {
            canvas.renderAll();
            historyIndex.current = targetIdx;
            isUndoRedoAction.current = false;
            setUpdater(v => v + 1);
        });
    }, [canvas]);

    return {
        initHistory,
        saveHistory,
        undo,
        redo,
        canUndo: historyIndex.current > 0,
        canRedo: historyIndex.current < history.current.length - 1
    };
}
