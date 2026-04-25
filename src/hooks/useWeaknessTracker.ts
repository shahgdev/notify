/**
 * useWeaknessTracker.ts
 * Aggregates data from SRS (useSRS) and Quiz (useQuizPerformance)
 * into a unified weakness profile per lecture.
 */

import { loadPerf } from "./useQuizPerformance";
import { SRSCard } from "./useSRS";

export interface TopicStrength {
    topic: string;
    score: number;        // 0-100, combined weakness score (lower = weaker)
    srsContrib: number;   // SRS ease factor contribution
    quizContrib: number;  // Quiz accuracy contribution
    incorrectCount: number;
    totalAttempts: number;
    trend: "improving" | "declining" | "stable";
}

export interface WeaknessProfile {
    weakTopics: TopicStrength[];     // sorted worst-first
    strongTopics: TopicStrength[];   // sorted best-first
    allTopics: TopicStrength[];
    overallScore: number;            // 0-100 overall mastery
    quizAvg: number;
    srsAvg: number;
    totalReviews: number;
}

function srsKey(lectureId: number) {
    return `srs_state_lecture_${lectureId}`;
}

/** Load SRS cards from localStorage */
function loadSRSCards(lectureId: number): SRSCard[] {
    try {
        const raw = localStorage.getItem(srsKey(lectureId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Convert SRS ease_factor (min 1.3, default 2.5, max ~3.5) to a 0-100 score */
function srsEaseToScore(ef: number, repetitions: number): number {
    if (repetitions === 0) return 0; // never reviewed = unknown
    const normalized = Math.max(0, Math.min(1, (ef - 1.3) / (3.0 - 1.3)));
    return Math.round(normalized * 100);
}

export function buildWeaknessProfile(lectureId: number, rawCards: any[]): WeaknessProfile {
    const srsCards = loadSRSCards(lectureId);
    const quizPerf = loadPerf(lectureId);

    // ─── Aggregate per topic ─────────────────────────────────────────────────
    const topicMap: Record<string, {
        srsScores: number[];
        quizCorrect: number;
        quizTotal: number;
        incorrectCount: number;
    }> = {};

    // SRS contribution
    rawCards.forEach((card, i) => {
        const topic = card.topic || "General";
        if (!topicMap[topic]) topicMap[topic] = { srsScores: [], quizCorrect: 0, quizTotal: 0, incorrectCount: 0 };
        const stored = srsCards[i];
        if (stored) {
            const score = srsEaseToScore(stored.ease_factor ?? 2.5, stored.repetitions ?? 0);
            topicMap[topic].srsScores.push(score);
            // Count SRS "Again" (interval reset = weakness signal)
            if (stored.repetitions === 0 && stored.last_reviewed) {
                topicMap[topic].incorrectCount += 1;
            }
        }
    });

    // Quiz contribution
    Object.entries(quizPerf.topicPerf).forEach(([topic, perf]) => {
        if (!topicMap[topic]) topicMap[topic] = { srsScores: [], quizCorrect: 0, quizTotal: 0, incorrectCount: 0 };
        topicMap[topic].quizCorrect += perf.correct;
        topicMap[topic].quizTotal += perf.total;
        topicMap[topic].incorrectCount += (perf.total - perf.correct);
    });

    // ─── Build TopicStrength objects ─────────────────────────────────────────
    const topics: TopicStrength[] = Object.entries(topicMap).map(([topic, data]) => {
        const srsAvg = data.srsScores.length > 0
            ? data.srsScores.reduce((a, b) => a + b, 0) / data.srsScores.length
            : 50;
        const quizScore = data.quizTotal > 0
            ? (data.quizCorrect / data.quizTotal) * 100
            : 50;

        // Weighted: SRS 40%, quiz 60% (quiz is explicit feedback)
        const score = Math.round(srsAvg * 0.4 + quizScore * 0.6);

        // Trend heuristic: if quiz last score > avg → improving
        const qp = quizPerf.topicPerf[topic];
        const trend: "improving" | "declining" | "stable" =
            qp && qp.lastScore > quizScore + 5
                ? "improving"
                : qp && qp.lastScore < quizScore - 5
                    ? "declining"
                    : "stable";

        return {
            topic,
            score,
            srsContrib: Math.round(srsAvg),
            quizContrib: Math.round(quizScore),
            incorrectCount: data.incorrectCount,
            totalAttempts: data.srsScores.length + data.quizTotal,
            trend,
        };
    });

    const sorted = [...topics].sort((a, b) => a.score - b.score);
    const weakTopics = sorted.filter((t) => t.score < 65);
    const strongTopics = [...sorted].reverse().filter((t) => t.score >= 65);
    const overallScore = topics.length > 0
        ? Math.round(topics.reduce((sum, t) => sum + t.score, 0) / topics.length)
        : 0;

    // SRS avg from all stored cards
    const srsAvg = srsCards.length > 0
        ? Math.round(srsCards.reduce((s, c) => s + srsEaseToScore(c.ease_factor ?? 2.5, c.repetitions ?? 0), 0) / srsCards.length)
        : 0;

    return {
        weakTopics,
        strongTopics,
        allTopics: sorted,
        overallScore,
        quizAvg: quizPerf.totalScore,
        srsAvg,
        totalReviews: quizPerf.totalAttempts,
    };
}

/** Sort raw cards/questions prioritizing weak topics */
export function prioritizeWeak<T extends { topic?: string }>(
    items: T[],
    profile: WeaknessProfile
): T[] {
    const scoreMap = Object.fromEntries(profile.allTopics.map((t) => [t.topic, t.score]));
    return [...items].sort((a, b) => {
        const sa = scoreMap[a.topic || ""] ?? 50;
        const sb = scoreMap[b.topic || ""] ?? 50;
        return sa - sb; // lowest score (weakest) first
    });
}
