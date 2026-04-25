import { useState, useCallback } from "react";

export interface SRSCard {
    question: string;
    answer: string;
    difficulty?: string;
    topic?: string;
    // SRS state
    interval: number;        // days until next review
    ease_factor: number;     // SM-2 ease factor (starts at 2.5)
    last_reviewed: string;   // ISO date string
    next_review: string;     // ISO date string
    repetitions: number;     // number of successful reviews
}

/** SM-2 quality ratings */
export type SRSRating = 0 | 3 | 4 | 5; // Again=0, Hard=3, Good=4, Easy=5

const MIN_EF = 1.3;
const INITIAL_EF = 2.5;

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + Math.max(1, Math.round(days)));
    return d;
}

function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}

function applyRating(card: SRSCard, quality: SRSRating): SRSCard {
    const now = new Date();
    let { interval, ease_factor, repetitions } = card;

    if (quality < 3) {
        // Failed — reset to learning
        interval = 1;
        repetitions = 0;
    } else {
        // Successful recall
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * ease_factor);
        }
        // Adjust ease factor
        ease_factor = Math.max(
            MIN_EF,
            ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        );
        repetitions += 1;
    }

    return {
        ...card,
        interval,
        ease_factor,
        repetitions,
        last_reviewed: todayISO(),
        next_review: addDays(now, interval).toISOString().split("T")[0],
    };
}

function storageKey(lectureId: number): string {
    return `srs_state_lecture_${lectureId}`;
}

function initCards(raw: any[], lectureId: number): SRSCard[] {
    const stored = localStorage.getItem(storageKey(lectureId));
    if (stored) {
        try {
            const parsed: SRSCard[] = JSON.parse(stored);
            // Merge stored state with fresh AI-generated content (questions may update)
            return raw.map((c, i) => ({
                ...c,
                interval: parsed[i]?.interval ?? 0,
                ease_factor: parsed[i]?.ease_factor ?? INITIAL_EF,
                last_reviewed: parsed[i]?.last_reviewed ?? "",
                next_review: parsed[i]?.next_review ?? todayISO(),
                repetitions: parsed[i]?.repetitions ?? 0,
            }));
        } catch { /* fall through */ }
    }
    // Fresh state
    return raw.map((c) => ({
        ...c,
        interval: 0,
        ease_factor: INITIAL_EF,
        last_reviewed: "",
        next_review: todayISO(),
        repetitions: 0,
    }));
}

function saveCards(cards: SRSCard[], lectureId: number) {
    localStorage.setItem(storageKey(lectureId), JSON.stringify(cards));
}

function isDue(card: SRSCard): boolean {
    return !card.next_review || card.next_review <= todayISO();
}

export function useSRS(rawCards: any[], lectureId: number) {
    const [cards, setCards] = useState<SRSCard[]>(() =>
        initCards(rawCards, lectureId)
    );

    const dueCards = cards
        .map((c, i) => ({ ...c, _idx: i }))
        .filter((c) => isDue(c));

    // Sort: Again-cards (repetitions=0) first, then by next_review asc
    const queue = [...dueCards].sort((a, b) => {
        if (a.repetitions === 0 && b.repetitions > 0) return -1;
        if (b.repetitions === 0 && a.repetitions > 0) return 1;
        return (a.next_review || "").localeCompare(b.next_review || "");
    });

    const rate = useCallback(
        (cardIdx: number, quality: SRSRating) => {
            setCards((prev) => {
                const updated = [...prev];
                updated[cardIdx] = applyRating(prev[cardIdx], quality);
                saveCards(updated, lectureId);
                return updated;
            });
        },
        [lectureId]
    );

    const resetAll = useCallback(() => {
        const fresh = initCards(rawCards.map((c) => ({
            ...c, interval: 0, ease_factor: INITIAL_EF,
            last_reviewed: "", next_review: todayISO(), repetitions: 0
        })), -1);
        setCards(fresh);
        localStorage.removeItem(storageKey(lectureId));
    }, [rawCards, lectureId]);

    const stats = {
        total: cards.length,
        due: dueCards.length,
        mastered: cards.filter((c) => c.interval >= 21).length,
        learning: cards.filter((c) => c.interval > 0 && c.interval < 21).length,
        new: cards.filter((c) => c.interval === 0).length,
    };

    return { cards, queue, rate, resetAll, stats, isDueNow: isDue };
}
