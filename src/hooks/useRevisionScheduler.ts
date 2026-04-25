/**
 * useRevisionScheduler.ts
 * Builds a prioritized daily revision list from SRS + weakness data
 * across all lectures stored in localStorage.
 */

import { loadPerf } from "./useQuizPerformance";

export interface RevisionItem {
    lectureId: number;
    lectureTitle: string;
    cardIndex: number;
    question: string;
    topic: string;
    difficulty: string;
    reason: "due_today" | "weak_topic" | "never_reviewed";
    interval: number;
    nextReview: string;
}

export interface DailyPlan {
    date: string;          // YYYY-MM-DD
    items: RevisionItem[];
    totalDue: number;
    weakTopics: string[];
    estimatedMinutes: number;
}

function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}

function isDue(nextReview: string): boolean {
    return !nextReview || nextReview <= todayISO();
}

/** Collect all lecture SRS states from localStorage */
function getStoredLectures(): { id: number; title: string }[] {
    try {
        const raw = localStorage.getItem("all_lectures_meta");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Save lecture metadata so the scheduler can find all lectures */
export function saveLectureMeta(lectures: { id: number; title: string }[]) {
    localStorage.setItem("all_lectures_meta", JSON.stringify(lectures));
}

function getSRSCards(lectureId: number): any[] {
    try {
        const raw = localStorage.getItem(`srs_state_lecture_${lectureId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function buildDailyPlan(
    maxItems: number = 15,
    lectures?: { id: number; title: string }[]
): DailyPlan {
    const today = todayISO();
    const meta = lectures || getStoredLectures();
    const allItems: RevisionItem[] = [];

    for (const lec of meta) {
        const cards = getSRSCards(lec.id);
        const quizPerf = loadPerf(lec.id);

        // Weak topics for this lecture (quiz accuracy < 60%)
        const weakTopics = new Set(
            Object.entries(quizPerf.topicPerf)
                .filter(([, v]) => v.lastScore < 60)
                .map(([k]) => k)
        );

        cards.forEach((card: any, idx: number) => {
            if (!card.question) return;

            const isCardDue = isDue(card.next_review || "");
            const isWeak = weakTopics.has(card.topic || "");
            const neverReviewed = !card.last_reviewed;

            let reason: RevisionItem["reason"] | null = null;
            if (neverReviewed) reason = "never_reviewed";
            else if (isCardDue) reason = "due_today";
            else if (isWeak) reason = "weak_topic";

            if (!reason) return;

            allItems.push({
                lectureId: lec.id,
                lectureTitle: lec.title,
                cardIndex: idx,
                question: card.question,
                topic: card.topic || "General",
                difficulty: card.difficulty || "medium",
                reason,
                interval: card.interval || 0,
                nextReview: card.next_review || today,
            });
        });
    }

    // Sort: never_reviewed → due_today (by interval asc) → weak_topic
    const reasonOrder = { never_reviewed: 0, due_today: 1, weak_topic: 2 };
    allItems.sort((a, b) => {
        const ro = reasonOrder[a.reason] - reasonOrder[b.reason];
        if (ro !== 0) return ro;
        return a.interval - b.interval;
    });

    const items = allItems.slice(0, maxItems);

    // Aggregate weak topics across all lectures
    const allWeakTopics = new Set<string>();
    for (const lec of meta) {
        const qp = loadPerf(lec.id);
        Object.entries(qp.topicPerf)
            .filter(([, v]) => v.lastScore < 60)
            .forEach(([k]) => allWeakTopics.add(k));
    }

    return {
        date: today,
        items,
        totalDue: allItems.length,
        weakTopics: Array.from(allWeakTopics).slice(0, 6),
        estimatedMinutes: Math.ceil(items.length * 0.75), // ~45s per card
    };
}

/** Request browser notification permission + schedule a reminder */
export async function scheduleNotification(hour: number = 19) {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return false;

    const now = new Date();
    const target = new Date();
    target.setHours(hour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();

    setTimeout(() => {
        new Notification("📚 Notify — Time to Revise!", {
            body: "Your daily revision session is ready. Stay consistent!",
            icon: "/favicon.ico",
            tag: "daily-revision",
        });
    }, delay);
    return true;
}
