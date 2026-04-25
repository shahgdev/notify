import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { getStroke } from 'perfect-freehand';
import { Check } from 'lucide-react';
import { initCanvas, getSvgPathFromStroke, defaultPenOptions } from './canvasUtils';
import CanvasToolbar from './CanvasToolbar';
import { useCanvasHistory } from './useCanvasHistory';

export interface CanvasEditorProps {
    noteContent: string;
    savedCanvas?: any;
    onSave: (json: any) => void;
    onClose: () => void;
}

export default function CanvasEditor({ noteContent, savedCanvas, onSave, onClose }: CanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState('pen');
    const [activeColor, setActiveColor] = useState('#2c2b28');
    const [penSize, setPenSize] = useState(8);
    const [isCursive, setIsCursive] = useState(true);
    const [layersOpen, setLayersOpen] = useState(false);

    // Spawners
    const [pendingShape, setPendingShape] = useState<string | null>(null);
    const [pendingSticker, setPendingSticker] = useState<string | null>(null);



    const { initHistory, saveHistory, undo, redo, canUndo, canRedo } = useCanvasHistory(fabricCanvas, 50);

    // Drawing Refs
    const isDrawing = useRef(false);
    const hasErased = useRef(false);
    const currentPoints = useRef<number[][]>([]);
    const tempPath = useRef<fabric.Path | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !canvasRef.current.parentElement) return;

        const container = canvasRef.current.parentElement;
        const canvas = initCanvas(canvasRef.current);
        setFabricCanvas(canvas);

        if (savedCanvas) {
            canvas.loadFromJSON(savedCanvas, () => {
                canvas.renderAll();
                initHistory();
            });
        } else {
            initHistory();
        }

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                canvas.setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
                canvas.renderAll();
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            canvas.dispose();
        };
    }, [savedCanvas]);

    // Handle Tool Change & Drawing Global Events
    useEffect(() => {
        if (!fabricCanvas) return;

        // Toggle selection mode
        const isSelectMode = activeTool === 'select';
        fabricCanvas.selection = isSelectMode;
        fabricCanvas.defaultCursor = isSelectMode ? 'default' : (activeTool === 'pen' ? 'crosshair' : 'default');

        fabricCanvas.forEachObject((obj) => {
            if (obj.get('data')?.isBaseLayer) return;
            obj.selectable = isSelectMode;
            obj.evented = isSelectMode;
        });

        const handleMouseDown = (opt: fabric.IEvent<MouseEvent>) => {
            if (activeTool === 'eraser') {
                isDrawing.current = true;
                hasErased.current = false;
                const pointer = fabricCanvas.getPointer(opt.e);
                const fabPoint = new fabric.Point(pointer.x, pointer.y);
                const objs = fabricCanvas.getObjects().filter(o => !o.data?.isBaseLayer);
                objs.forEach(o => {
                    if (o.containsPoint(fabPoint)) {
                        fabricCanvas.remove(o);
                        hasErased.current = true;
                    }
                });
                return;
            }

            const pointer = fabricCanvas.getPointer(opt.e);

            if (activeTool === 'text') {
                const text = new fabric.IText('Type here...', {
                    left: pointer.x,
                    top: pointer.y,
                    fontFamily: 'Inter, sans-serif',
                    fill: activeColor,
                    fontSize: 24,
                    data: { type: 'text' }
                });
                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                text.enterEditing();
                text.selectAll();
                setActiveTool('select');
                saveHistory();
                return;
            }

            if (activeTool === 'shape' && pendingShape) {
                const commonProps = {
                    left: pointer.x,
                    top: pointer.y,
                    originX: 'center',
                    originY: 'center',
                    fill: 'transparent',
                    stroke: activeColor,
                    strokeWidth: 4,
                    data: { type: pendingShape }
                };

                let obj: fabric.Object | null = null;
                if (pendingShape === 'rect') obj = new fabric.Rect({ ...commonProps, width: 100, height: 100, rx: 16, ry: 16 });
                else if (pendingShape === 'circle') obj = new fabric.Circle({ ...commonProps, radius: 50 });
                else if (pendingShape === 'triangle') obj = new fabric.Triangle({ ...commonProps, width: 100, height: 100 });
                else if (pendingShape === 'line') obj = new fabric.Line([-50, 0, 50, 0], { ...commonProps });
                else if (pendingShape === 'arrow') {
                    // Fabric JS doesn't have a native arrow, grouping a line and a triangle
                    const line = new fabric.Line([0, 50, 0, -50], { stroke: activeColor, strokeWidth: 4 });
                    const head = new fabric.Triangle({ width: 20, height: 20, fill: activeColor, left: 0, top: -50, originX: 'center', originY: 'bottom' });
                    obj = new fabric.Group([line, head], { ...commonProps });
                }

                if (obj) {
                    obj.set({ selectable: true, evented: true });
                    fabricCanvas.add(obj);
                    fabricCanvas.setActiveObject(obj);
                    setActiveTool('select');
                    setPendingShape(null);
                    saveHistory();
                }
                return;
            }

            if (activeTool === 'sticker' && pendingSticker) {
                const text = new fabric.IText(pendingSticker, {
                    left: pointer.x,
                    top: pointer.y,
                    originX: 'center',
                    originY: 'center',
                    fontFamily: 'sans-serif',
                    fontSize: 64,
                    selectable: true,
                    data: { type: 'sticker' }
                });
                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                setActiveTool('select');
                setPendingSticker(null);
                saveHistory();
                return;
            }

            if (activeTool !== 'pen') return;

            isDrawing.current = true;
            const pressure = (opt.e as any).pressure ?? 0.5;
            currentPoints.current = [[pointer.x, pointer.y, pressure]];

            const stroke = getStroke(currentPoints.current, {
                ...defaultPenOptions,
                size: penSize,
                thinning: isCursive ? 0.7 : -0.2,
                smoothing: isCursive ? 0.8 : 0.2,
                streamline: isCursive ? 0.6 : 0.2
            });
            const pathData = getSvgPathFromStroke(stroke);

            tempPath.current = new fabric.Path(pathData, {
                fill: activeColor,
                selectable: false,
                evented: false,
                data: { type: 'freehand' }
            });
            fabricCanvas.add(tempPath.current);
        };

        const handleMouseMove = (opt: fabric.IEvent<MouseEvent>) => {
            if (activeTool === 'eraser' && isDrawing.current) {
                const pointer = fabricCanvas.getPointer(opt.e);
                const fabPoint = new fabric.Point(pointer.x, pointer.y);
                const objs = fabricCanvas.getObjects().filter(o => !o.data?.isBaseLayer);
                objs.forEach(o => {
                    if (o.containsPoint(fabPoint)) {
                        fabricCanvas.remove(o);
                        hasErased.current = true;
                    }
                });
                return;
            }

            if (!isDrawing.current || activeTool !== 'pen' || !tempPath.current) return;
            const pointer = fabricCanvas.getPointer(opt.e);
            const pressure = (opt.e as any).pressure ?? 0.5;
            currentPoints.current.push([pointer.x, pointer.y, pressure]);

            const stroke = getStroke(currentPoints.current, {
                ...defaultPenOptions,
                size: penSize,
                thinning: isCursive ? 0.7 : -0.2,
                smoothing: isCursive ? 0.8 : 0.2,
                streamline: isCursive ? 0.6 : 0.2
            });
            const pathData = getSvgPathFromStroke(stroke);

            fabricCanvas.remove(tempPath.current);
            tempPath.current = new fabric.Path(pathData, {
                fill: activeColor,
                selectable: false,
                evented: false,
                data: { type: 'freehand' }
            });
            fabricCanvas.add(tempPath.current);
        };

        const handleMouseUp = () => {
            if (activeTool === 'eraser') {
                isDrawing.current = false;
                if (hasErased.current) {
                    saveHistory();
                    hasErased.current = false;
                }
                return;
            }

            if (activeTool !== 'pen') return;
            isDrawing.current = false;
            if (tempPath.current) {
                tempPath.current.set({ selectable: isSelectMode, evented: isSelectMode });
                tempPath.current.setCoords();
                tempPath.current = null;
                saveHistory();
            }
            currentPoints.current = [];
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);

        // Handle native Fabric actions
        const handleObjectChange = (e: any) => {
            if (e.target && e.target.data?.isBaseLayer) return;
            // Native actions like drag, scale, rotate triggers modified
            if (activeTool !== 'pen' && activeTool !== 'eraser') {
                // Ignore programmatic additions that we already catch, if possible, but for simplicity we rely on native events.
                saveHistory();
            }
        };

        const debouncedSaveHistory = () => {
            // Using a simple debounce to group multiple object removal events into one history state
            clearTimeout((window as any)._historyDebounce);
            (window as any)._historyDebounce = setTimeout(() => {
                if (activeTool !== 'pen' && activeTool !== 'eraser') saveHistory();
            }, 100);
        };

        fabricCanvas.on('object:modified', handleObjectChange);
        fabricCanvas.on('object:added', handleObjectChange);
        fabricCanvas.on('object:removed', debouncedSaveHistory);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
            fabricCanvas.off('object:modified', handleObjectChange);
            fabricCanvas.off('object:added', handleObjectChange);
            fabricCanvas.off('object:removed', debouncedSaveHistory);
        };
    }, [fabricCanvas, activeTool, activeColor, penSize, isCursive, saveHistory, pendingShape, pendingSticker]);

    const handleAddText = () => {
        setActiveTool('text');
    };

    const handleAddShape = (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow') => {
        setPendingShape(type);
        setActiveTool('shape');
    };

    const handleAddSticker = (emoji: string) => {
        setPendingSticker(emoji);
        setActiveTool('sticker');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvas) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target?.result as string, (img) => {
                img.scaleToWidth(300);
                img.set({ left: 100, top: 100, data: { type: 'image' } });
                fabricCanvas.add(img);
                fabricCanvas.setActiveObject(img);
                setActiveTool('select');
            });
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDone = () => {
        if (fabricCanvas) {
            onSave(fabricCanvas.toJSON(['data'])); // Serialize custom data fields too
        } else {
            onClose();
        }
    };

    useEffect(() => {
        if (!fabricCanvas) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (fabricCanvas.getActiveObject() as fabric.IText)?.isEditing) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = fabricCanvas.getActiveObjects();
                if (activeObjects.length) {
                    activeObjects.forEach(obj => {
                        if (!obj.data?.isBaseLayer) fabricCanvas.remove(obj);
                    });
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.requestRenderAll();
                    saveHistory();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { if (e.shiftKey) redo(); else undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') redo();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas, initHistory, saveHistory, undo, redo]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#fdfaf4] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-border/20 flex items-center justify-between px-8 shadow-sm z-50 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="font-display font-black text-[#5c5b57] text-lg tracking-widest uppercase">Canvas Mode</h2>
                    <span className="text-[10px] font-bold text-[#5c5b57]/40 uppercase tracking-widest">
                        ← Notes · Drawings →
                    </span>
                </div>
                <button
                    onClick={handleDone}
                    className="group flex items-center justify-center gap-2.5 rounded-full bg-yellow-500/10 text-[#2c2b28] border border-[#2c2b28]/10 px-8 py-3.5 font-black uppercase tracking-widest text-[10px] hover:bg-[#2c2b28] hover:text-on-surface hover:border-[#2c2b28] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ring-[3px] ring-transparent hover:ring-[#2c2b28]/20"
                >
                    <Check className="w-4 h-4 text-green-500 group-hover:text-green-400 group-hover:scale-125 transition-all duration-300" strokeWidth={3} />
                    <span>Done</span>
                </button>
            </div>

            {/* Split layout: Notes left | Canvas right */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Text notes panel — full opacity, always readable */}
                <div className="w-[45%] flex-shrink-0 overflow-y-auto border-r border-[#2c2b28]/10 bg-[#fdfaf4] p-10">
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5c5b57]/40">
                            Written notes
                        </span>
                    </div>
                    {noteContent ? (
                        <div
                            className="prose prose-lg max-w-none text-[#3b3a36] prose-headings:font-black prose-headings:text-[#2c2b28] prose-headings:tracking-tight prose-p:leading-relaxed prose-li:text-[#3b3a36]"
                            dangerouslySetInnerHTML={{ __html: noteContent }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <p className="text-sm text-[#5c5b57]/40 font-medium">No written notes yet</p>
                            <p className="text-xs text-[#5c5b57]/30 mt-1">Save notes first, then annotate here</p>
                        </div>
                    )}
                </div>

                {/* DIVIDER */}
                <div className="w-px flex-shrink-0 bg-[#2c2b28]/10" />

                {/* RIGHT: Canvas drawing panel */}
                <div
                    className="flex-1 relative flex flex-col bg-[#fdfaf4] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden"
                    style={{ cursor: activeTool === 'pen' ? 'crosshair' : 'default' }}
                >
                    <div className="absolute top-3 left-3 z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5c5b57]/30">
                            Canvas area
                        </span>
                    </div>

                    <CanvasToolbar
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        activeColor={activeColor}
                        setActiveColor={setActiveColor}
                        penSize={penSize}
                        setPenSize={setPenSize}
                        isCursive={isCursive}
                        setIsCursive={setIsCursive}
                        onUndo={undo}
                        onRedo={redo}
                        onAddShape={handleAddShape}
                        onAddSticker={handleAddSticker}
                        onAddText={handleAddText}
                        onTriggerImageUpload={() => fileInputRef.current?.click()}
                    />

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                    {/* Fabric canvas fills the right panel */}
                    <div className="absolute inset-0">
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
