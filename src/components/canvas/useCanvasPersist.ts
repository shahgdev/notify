export function useCanvasPersist() {
    return {
        saveCanvas: async (json: any) => { console.log("Save Canvas", json); },
        loadCanvas: async () => { return null; }
    };
}
