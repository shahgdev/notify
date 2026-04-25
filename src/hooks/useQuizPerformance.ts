import { useCallback } from "react";

export interface TopicPerf {
    correct: number;
    total: number;
    lastScore: number; // 0-100
}

export interface QuizPerformance {
    totalAttempts: number;
    totalScore: number; // cumulative pct average
    topicPerf: Record<string, TopicPerf>;
    difficultyAdjust: "easy" | "normal" | "hard"; // adaptive level
}

function storageKey(lectureId: number): string {
    return `quiz_perf_lecture_${lectureId}`;
}

function defaultPerf(): QuizPerformance {
    return {
        totalAttempts: 0,
        totalScore: 0,
        topicPerf: {},
        difficultyAdjust: "normal",
    };
}

export function loadPerf(lectureId: number): QuizPerformance {
    try {
        const raw = localStorage.getItem(storageKey(lectureId));
        return raw ? JSON.parse(raw) : defaultPerf();
    } catch {
        return defaultPerf();
    }
}

function savePerf(lectureId: number, perf: QuizPerformance) {
    localStorage.setItem(storageKey(lectureId), JSON.stringify(perf));
}

export function recordSession(
    lectureId: number,
    results: { topic: string; correct: boolean }[]
): QuizPerformance {
    const perf = loadPerf(lectureId);
    const sessionCorrect = results.filter((r) => r.correct).length;
    const sessionPct = results.length > 0 ? (sessionCorrect / results.length) * 100 : 0;

    perf.totalAttempts += 1;
    // Rolling average
    perf.totalScore = Math.round(
        (perf.totalScore * (perf.totalAttempts - 1) + sessionPct) / perf.totalAttempts
    );

    // Per-topic stats
    results.forEach(({ topic, correct }) => {
        if (!perf.topicPerf[topic]) perf.topicPerf[topic] = { correct: 0, total: 0, lastScore: 0 };
        perf.topicPerf[topic].total += 1;
        if (correct) perf.topicPerf[topic].correct += 1;
        perf.topicPerf[topic].lastScore = Math.round(
            (perf.topicPerf[topic].correct / perf.topicPerf[topic].total) * 100
        );
    });

    // Adjust difficulty: if avg > 80% → hard, < 50% → easy
    if (perf.totalScore >= 80) perf.difficultyAdjust = "hard";
    else if (perf.totalScore < 50 && perf.totalAttempts > 0) perf.difficultyAdjust = "easy";
    else perf.difficultyAdjust = "normal";

    savePerf(lectureId, perf);
    return perf;
}

/** Sort questions: weak topics first, then match target difficulty */
export function sortAdaptive(questions: any[], perf: QuizPerformance): any[] {
    const topicScore = (topic: string) => {
        const t = perf.topicPerf[topic];
        return t ? t.lastScore : 50; // unknown = neutral
    };
    const diffOrder = perf.difficultyAdjust === "hard"
        ? { hard: 0, medium: 1, easy: 2 }
        : perf.difficultyAdjust === "easy"
            ? { easy: 0, medium: 1, hard: 2 }
            : { medium: 0, hard: 1, easy: 2 };

    return [...questions].sort((a, b) => {
        const weakDiff = topicScore(a.topic || "") - topicScore(b.topic || "");
        if (weakDiff !== 0) return weakDiff; // weakest topics first
        return (diffOrder as any)[a.difficulty || "medium"] - (diffOrder as any)[b.difficulty || "medium"];
    });
}
