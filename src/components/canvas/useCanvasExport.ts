import { fabric } from 'fabric';
import html2canvas from 'html2canvas';

export function useCanvasExport(canvas: fabric.Canvas | null, containerRef: React.RefObject<HTMLDivElement>) {

    const triggerDownload = (dataUrl: string, filename: string) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    };

    const exportAsImage = async (format: 'png' | 'jpeg', includeBackground = true) => {
        if (!canvas || !containerRef.current) return;

        // If including the AI notes background, we must capture the HTML DOM since the AI notes are absolute HTML elements behind the canvas
        if (includeBackground) {
            try {
                // Create a composite render
                const canvasElement = await html2canvas(containerRef.current, { backgroundColor: '#fdfaf4', scale: 2 });
                triggerDownload(canvasElement.toDataURL(`image/${format}`, 1.0), `notes-export.${format}`);
            } catch (err) { console.error("Export composite failed", err) }
        } else {
            // Only export drawings transparently
            const dataUrl = canvas.toDataURL({ format, multiplier: 2 });
            triggerDownload(dataUrl, `annotations-only.${format}`);
        }
    };

    return { exportAsImage };
}
