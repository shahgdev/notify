import { fabric } from 'fabric';
import { getStroke } from 'perfect-freehand';

export const initCanvas = (canvasElement: HTMLCanvasElement): fabric.Canvas => {
    const canvas = new fabric.Canvas(canvasElement, {
        isDrawingMode: false,
        width: window.innerWidth,
        height: window.innerHeight,
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: 'transparent',
    });
    return canvas;
};

export const lockObject = (obj: fabric.Object) => {
    obj.set({
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        hasControls: false,
        hasBorders: false,
    });
};

export const getSvgPathFromStroke = (stroke: number[][]) => {
    if (!stroke || stroke.length === 0) return '';
    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ['M', ...stroke[0], 'Q']
    );
    d.push('Z');
    return d.join(' ');
};

export const defaultPenOptions = {
    size: 8,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t: number) => t,
    simulatePressure: true,
    last: true
};
