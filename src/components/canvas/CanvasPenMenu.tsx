import React from 'react';
import { HexColorPicker } from "react-colorful";
import { Check, Edit3 } from 'lucide-react';

interface CanvasPenMenuProps {
    color: string;
    onChangeColor: (c: string) => void;
    size: number;
    onChangeSize: (s: number) => void;
    isCursive: boolean;
    onToggleCursive: () => void;
}

export default function CanvasPenMenu({
    color, onChangeColor, size, onChangeSize, isCursive, onToggleCursive
}: CanvasPenMenuProps) {

    const presetColors = ['#2c2b28', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
        <div className="p-4 bg-[#2c2b28] rounded-[24px] shadow-2xl flex flex-col gap-5 border border-[#403e39] w-64">

            {/* Color section */}
            <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black tracking-widest uppercase text-on-surface/50">Ink Color</span>
                <div className="[&>.react-colorful]:w-full [&>.react-colorful]:h-32">
                    <HexColorPicker color={color} onChange={onChangeColor} />
                </div>
                <div className="flex justify-between mt-1">
                    {presetColors.map(c => (
                        <button
                            key={c}
                            onClick={() => onChangeColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            <div className="w-full h-px bg-surface-container-low" />

            {/* Thickness Slider */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest uppercase text-on-surface/50">Thickness</span>
                    <span className="text-[10px] font-black text-on-surface/80">{size}px</span>
                </div>

                {/* Visual Dot Preview */}
                <div className="w-full h-12 flex items-center justify-center bg-white rounded-xl shadow-inner mb-1 overflow-hidden">
                    <div
                        className="rounded-full shadow-sm"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: color
                        }}
                    />
                </div>

                <input
                    type="range"
                    min="2" max="32"
                    value={size}
                    onChange={(e) => onChangeSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-low rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                />
            </div>

            <div className="w-full h-px bg-surface-container-low" />

            {/* Cursive Mode Toggle */}
            <button
                onClick={onToggleCursive}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-lowest transition-colors group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${isCursive ? 'bg-primary text-on-surface' : 'bg-surface-container-low text-on-surface/50 group-hover:bg-surface-container'}`}>
                        <Edit3 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-bold text-on-surface leading-none">Apple Pencil</span>
                        <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface/40 leading-none">Pressure & Cursive</span>
                    </div>
                </div>
                <div className={`w-5 h-5 rounded border ${isCursive ? 'bg-primary border-primary flex items-center justify-center' : 'border-outline-variant/30'}`}>
                    {isCursive && <Check className="w-3 h-3 text-on-surface" />}
                </div>
            </button>

        </div>
    );
}
