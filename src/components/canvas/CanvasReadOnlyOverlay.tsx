import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface CanvasReadOnlyOverlayProps {
    canvasJSON: any;
}

export default function CanvasReadOnlyOverlay({ canvasJSON }: CanvasReadOnlyOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !canvasJSON || !canvasRef.current.parentElement) return;

        const container = canvasRef.current.parentElement;
        const staticCanvas = new fabric.StaticCanvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
        });

        staticCanvas.loadFromJSON(canvasJSON, () => {
            staticCanvas.renderAll();
        });

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                staticCanvas.setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
                staticCanvas.renderAll();
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            staticCanvas.dispose();
        };
    }, [canvasJSON]);

    if (!canvasJSON || Object.keys(canvasJSON).length === 0) return null;

    return (
        <div className="absolute inset-0 z-20 pointer-events-none w-full h-full">
            <canvas ref={canvasRef} />
        </div>
    );
}
