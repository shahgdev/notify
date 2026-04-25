import React from 'react';
import { HexColorPicker } from 'react-colorful';

interface CanvasColorPickerProps {
    color: string;
    onChange: (newColor: string) => void;
}

export default function CanvasColorPicker({ color, onChange }: CanvasColorPickerProps) {
    const quickColors = ['#2c2b28', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#ffffff'];

    return (
        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-border/20 flex flex-col gap-4 animate-in fade-in zoom-in-95 pointer-events-auto w-56">
            <HexColorPicker color={color} onChange={onChange} style={{ width: '100%', height: '150px' }} />
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {quickColors.map((c) => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c === color ? 'border-primary scale-110' : 'border-black/10'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
        </div>
    );
}
