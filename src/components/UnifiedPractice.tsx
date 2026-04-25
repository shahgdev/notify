import { useState, useMemo } from "react";
import { Brain, ArrowLeft, ArrowRight, Timer, Zap, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedPracticeProps {
    lectureId: number;
    flashcards: any[];
    quiz: any[];
}

export default function UnifiedPractice({ lectureId, flashcards, quiz }: UnifiedPracticeProps) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [mastered, setMastered] = useState<number[]>([]);

    const questions = useMemo(() => {
        return (flashcards || []).map(c => ({
            question: c.question,
            answer: c.answer,
        }));
    }, [flashcards]);

    if (!questions.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="h-20 w-20 rounded-[2rem] bg-surface-container-low flex items-center justify-center mb-5 border border-outline-variant/10">
               <Brain className="h-9 w-9 text-primary/40" />
             </div>
             <p className="text-lg font-headline font-bold text-on-surface mb-2">No Practice Available</p>
             <p className="text-sm text-on-surface-variant">Practice will be generated when a lecture is processed.</p>
           </div>
        );
    }

    const currentCard = questions[currentIdx];
    const progress = Math.round((mastered.length / questions.length) * 100) || 0;

    const handleNext = () => {
        setIsFlipped(false);
        if (currentIdx < questions.length - 1) setCurrentIdx(c => c + 1);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        if (currentIdx > 0) setCurrentIdx(c => c - 1);
    };

    const handleMaster = () => {
        if (!mastered.includes(currentIdx)) setMastered([...mastered, currentIdx]);
        handleNext();
    };

    return (
        <div className="w-full flex md:col-span-12 flex-col gap-12">
            {/* Practice Header & Progress */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-surface-container-lowest backdrop-blur-2xl border border-outline-variant/20 p-8 rounded-xl relative">
                <div className="space-y-2">
                    <span className="text-primary font-headline tracking-[0.2em] text-xs uppercase font-bold">Current Session</span>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">Active Recall</h2>
                    <p className="text-on-surface-variant max-w-md">Mastering content through active recall and spaced repetition.</p>
                </div>
                <div className="w-full md:w-72 space-y-3">
                    <div className="flex justify-between text-xs font-headline tracking-widest text-on-surface-variant uppercase">
                        <span>Mastery Progress</span>
                        <span className="text-primary">{mastered.length} / {questions.length} Cards</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(58,223,250,0.5)] transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </section>

            {/* Flashcard Flip System */}
            <section className="relative perspective-1000 group mx-auto w-full max-w-4xl aspect-[16/10] md:aspect-[16/9]" onClick={() => setIsFlipped(!isFlipped)}>
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10"></div>
                
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={isFlipped ? 'back' : 'front'}
                        initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
                        animate={{ rotateX: 0, opacity: 1 }}
                        exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 backface-hidden bg-surface-container-lowest backdrop-blur-3xl rounded-[3rem] border border-primary/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer hover:border-primary/40 transition-colors overflow-hidden"
                    >
                        {/* Top label */}
                        <div className="flex-shrink-0 flex items-center px-8 pt-7 pb-0">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(58,223,250,1)]"></span>
                                <span className="text-[10px] uppercase font-headline tracking-[0.2em] font-bold text-primary">
                                    {isFlipped ? 'Answer' : 'Question'}
                                </span>
                            </div>
                        </div>

                        {/* Scrollable text area */}
                        <div className="flex-1 flex items-center justify-center overflow-y-auto px-8 md:px-16 py-4 text-center">
                            <h3 className={`font-headline font-bold text-on-surface leading-[1.25] tracking-tight ${
                                isFlipped ? 'text-primary-fixed' : ''
                            } ${
                                (isFlipped ? currentCard.answer : currentCard.question).length > 200
                                    ? 'text-xl md:text-2xl lg:text-3xl'
                                    : (isFlipped ? currentCard.answer : currentCard.question).length > 100
                                    ? 'text-2xl md:text-3xl lg:text-4xl'
                                    : 'text-2xl md:text-4xl lg:text-5xl'
                            }`}>
                                {isFlipped ? currentCard.answer : currentCard.question}
                            </h3>
                        </div>

                        {/* Hint row — always visible, never overlaps */}
                        <div className="flex-shrink-0 flex items-center justify-center gap-2 px-8 pb-6 pt-2 text-on-surface-variant/60">
                            <span className="text-xs font-medium">
                                {isFlipped ? '↑ Tap to go back to question' : '↓ Tap to see answer'}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* Control Actions */}
            <section className="grid grid-cols-2 md:flex md:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-4xl mx-auto">
                <button 
                  onClick={handlePrev}
                  className="col-span-1 order-2 md:order-none group px-4 md:px-8 py-4 rounded-xl bg-surface-container-lowest backdrop-blur-md border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 md:gap-3">
                    <ArrowLeft className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" />
                    <span className="font-headline text-xs md:text-sm font-bold tracking-widest uppercase">Previous</span>
                </button>
                
                <button 
                  onClick={handleMaster}
                  className="col-span-2 order-1 md:order-none px-6 md:px-12 py-5 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-headline font-bold tracking-widest uppercase text-sm shadow-[0_10px_40px_rgba(58,223,250,0.3)] hover:scale-105 active:scale-95 transition-all outline-none md:w-auto w-full text-center">
                    Mark as Mastered
                </button>
                
                <button 
                  onClick={handleNext}
                  className="col-span-1 order-3 md:order-none group px-4 md:px-8 py-4 rounded-xl bg-surface-container-lowest backdrop-blur-md border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 md:gap-3">
                    <span className="font-headline text-xs md:text-sm font-bold tracking-widest uppercase">Skip Card</span>
                    <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
            </section>

            {/* Stats Bento Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4">
                    <Timer className="text-primary w-8 h-8" />
                    <div>
                        <div className="text-3xl font-headline font-bold text-on-surface">00:00</div>
                        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mt-1">Session Time</div>
                    </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4">
                    <Zap className="text-secondary w-8 h-8" />
                    <div>
                        <div className="text-3xl font-headline font-bold text-on-surface">{progress}%</div>
                        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mt-1">Mastery Rate</div>
                    </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4">
                    <History className="text-error w-8 h-8" />
                    <div>
                        <div className="text-3xl font-headline font-bold text-on-surface">{questions.length - mastered.length}</div>
                        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mt-1">Needs Review</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
