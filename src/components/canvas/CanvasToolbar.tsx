import React, { useState } from 'react';
import { GripHorizontal, GripVertical, MousePointer2, Pen, Square, Type, ImageIcon, StickyNote, Eraser, Undo, Redo, Layers, Settings, Palette, ChevronLeft, ChevronRight, ArrowRightLeft, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import CanvasShapeMenu from './CanvasShapeMenu';
import CanvasColorPicker from './CanvasColorPicker';
import CanvasPenMenu from './CanvasPenMenu';
import CanvasStickerPanel from './CanvasStickerPanel';

interface CanvasToolbarProps {
    activeTool: string;
    setActiveTool: (tool: string) => void;
    activeColor: string;
    setActiveColor: (color: string) => void;
    penSize: number;
    setPenSize: (size: number) => void;
    isCursive: boolean;
    setIsCursive: (b: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
    onAddShape: (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow') => void;
    onAddSticker: (emoji: string) => void;
    onAddText: () => void;
    onTriggerImageUpload: () => void;
}

export default function CanvasToolbar({
    activeTool, setActiveTool,
    activeColor, setActiveColor,
    penSize, setPenSize, isCursive, setIsCursive,
    onUndo, onRedo,
    onAddShape, onAddSticker, onAddText, onTriggerImageUpload
}: CanvasToolbarProps) {

    const [activePopover, setActivePopover] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [toolbarScale, setToolbarScale] = useState<1 | 0.85>(1);
    const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

    // Limits dragging exclusively to the Grip Handle
    const dragControls = useDragControls();

    const isVertical = orientation === 'vertical';

    const togglePopover = (id: string, toolId?: string) => {
        if (toolId) setActiveTool(toolId);
        setActivePopover(prev => prev === id ? null : id);
    };

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'pen', icon: Pen, label: 'Pen', hasPopover: true, popoverType: 'pen' },
        { id: 'shapes', icon: Square, label: 'Shapes', hasPopover: true, popoverType: 'shape' },
        { id: 'text', icon: Type, label: 'Text', hasPopover: true, popoverType: 'color' }, // Change from action to color popover!
        { id: 'image', icon: ImageIcon, label: 'Image', action: onTriggerImageUpload },
        { id: 'stickers', icon: StickyNote, label: 'Stickers', hasPopover: true, popoverType: 'sticker' },
        { id: 'eraser', icon: Eraser, label: 'Eraser' },
    ];

    return (
        <motion.div
            key={orientation} // Important: Resets position automatically to avoid drift bug when changing size/shape
            drag={!isCollapsed}
            dragControls={dragControls}
            dragListener={false} // Disables dragging from anywhere else on the menu
            dragElastic={0.3} // Smoother bounce on screen edges
            dragMomentum={true} // Enables natural gliding/throw physics
            whileDrag={{ scale: 1.02, cursor: "grabbing" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: toolbarScale }}
            className={`absolute left-2 md:left-6 top-[20%] md:top-32 bg-[#2c2b28] text-white rounded-3xl flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.35)] z-[100] border border-[#403e39] transition-all duration-300 
                ${isVertical ? 'flex-col p-2 gap-1 md:p-3 md:gap-4' : 'flex-row p-2 gap-1 md:p-3 md:gap-4'} 
                ${isCollapsed ? (isVertical ? 'w-14 min-h-14 justify-center' : 'h-14 min-w-14 justify-center') : ''}`}
            style={{ transformOrigin: 'top left' }}
        >
            {isCollapsed ? (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-3 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-colors w-10 h-10 md:w-12 md:h-12 flex justify-center items-center group relative"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a18] text-on-surface text-[10px] font-black tracking-widest uppercase rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
                        Expand Toolbar
                    </span>
                </button>
            ) : (
                <>
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className={`cursor-grab active:cursor-grabbing text-on-surface/30 hover:text-on-surface/60 flex justify-center ${isVertical ? 'w-full pb-1' : 'h-full px-1 items-center'}`}
                    >
                        {isVertical ? <GripHorizontal className="w-5 h-5 pointer-events-none" /> : <GripVertical className="w-5 h-5 pointer-events-none" />}
                    </div>

                    {/* Tools Grid (2 columns if vertical, 2 rows if horizontal) */}
                    <div className={`grid gap-1.5 md:gap-2 ${isVertical ? 'grid-cols-2' : 'grid-rows-2 grid-flow-col'}`}>
                        {tools.map((t) => (
                            <div key={t.id} className="relative group/btn flex justify-center">
                                <button
                                    onClick={() => {
                                        if (t.action) t.action();
                                        else if (t.hasPopover) togglePopover(t.popoverType, t.id);
                                        else { setActiveTool(t.id); setActivePopover(null); }
                                    }}
                                    className={`p-2.5 rounded-2xl transition-all group relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11
                        ${activeTool === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {t.hasPopover && activeTool === t.id ? (
                                        <Palette className="w-4 h-4 md:w-5 md:h-5 absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    ) : null}

                                    <t.icon className={`w-4 h-4 md:w-5 md:h-5 ${t.hasPopover && activeTool === t.id ? 'opacity-100 group-hover:opacity-0 transition-opacity' : ''}`} />

                                    {/* Tooltip on hover */}
                                    {!activePopover && (
                                        <span className={`absolute px-3 py-1.5 bg-[#1a1a18] text-on-surface text-[10px] font-black tracking-widest uppercase rounded-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50
                                            ${isVertical ? 'left-full ml-4 top-1/2 -translate-y-1/2' : 'top-full mt-4 left-1/2 -translate-x-1/2'}`}>
                                            {t.label}
                                        </span>
                                    )}

                                    {/* Active Indicator Color */}
                                    {activeTool === t.id && (
                                        <span className="absolute inset-0 rounded-2xl border-2 pointer-events-none" style={{ borderColor: activeColor }} />
                                    )}
                                </button>

                                {/* Popovers */}
                                {activePopover === t.popoverType && (
                                    <div className={`absolute z-[70] ${isVertical ? 'left-full ml-4 top-1/2 -translate-y-1/2' : 'top-full mt-4 left-0'}`}>
                                        {t.popoverType === 'pen' && (
                                            <CanvasPenMenu
                                                color={activeColor} onChangeColor={(c) => { setActiveColor(c); }}
                                                size={penSize} onChangeSize={setPenSize}
                                                isCursive={isCursive} onToggleCursive={() => setIsCursive(!isCursive)}
                                            />
                                        )}
                                        {t.popoverType === 'color' && (
                                            <CanvasColorPicker color={activeColor} onChange={(c) => { setActiveColor(c); }} />
                                        )}
                                        {t.popoverType === 'shape' && (
                                            <CanvasShapeMenu onSelectShape={(type) => { onAddShape(type); setActivePopover(null); }} />
                                        )}
                                        {t.popoverType === 'sticker' && (
                                            <CanvasStickerPanel onSelectSticker={(emoji) => { onAddSticker(emoji); setActivePopover(null); }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={`bg-white/10 flex-shrink-0 ${isVertical ? 'w-full h-px my-1' : 'h-full w-px mx-1'}`} />

                    {/* Actions Grid */}
                    <div className={`grid gap-1.5 md:gap-2 ${isVertical ? 'grid-cols-2' : 'grid-rows-2 grid-flow-col'}`}>
                        <button onClick={onUndo} className="p-2.5 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-colors w-10 h-10 md:w-11 md:h-11 flex justify-center items-center group/btn relative">
                            <Undo className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={onRedo} className="p-2.5 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-colors w-10 h-10 md:w-11 md:h-11 flex justify-center items-center group/btn relative">
                            <Redo className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={() => setToolbarScale(s => s === 1 ? 0.85 : 1)} className="p-2.5 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-colors w-10 h-10 md:w-11 md:h-11 flex justify-center items-center group/btn relative">
                            <Settings className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={() => setOrientation(isVertical ? 'horizontal' : 'vertical')} className="p-2.5 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-colors w-10 h-10 md:w-11 md:h-11 flex justify-center items-center group/btn relative">
                            {isVertical ? <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowUpDown className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                        <button onClick={() => setIsCollapsed(true)} className="p-2.5 rounded-2xl text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors w-10 h-10 md:w-11 md:h-11 flex justify-center items-center group/btn relative">
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
