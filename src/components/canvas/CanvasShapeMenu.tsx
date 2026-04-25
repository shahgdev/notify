import React from 'react';
import { Square, Circle, Triangle, ArrowRight, Minus } from 'lucide-react';

interface CanvasShapeMenuProps {
    onSelectShape: (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow') => void;
}

export default function CanvasShapeMenu({ onSelectShape }: CanvasShapeMenuProps) {
    const shapes = [
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'triangle', icon: Triangle, label: 'Triangle' },
        { id: 'line', icon: Minus, label: 'Line' },
        { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    ] as const;

    return (
        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-border/20 grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 w-48 pointer-events-auto">
            {shapes.map(s => (
                <button
                    key={s.id}
                    onClick={() => onSelectShape(s.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-black/5 transition-all text-[#3b3a36]"
                >
                    <s.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black tracking-widest uppercase">{s.label}</span>
                </button>
            ))}
        </div>
    );
}
