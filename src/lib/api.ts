import axios from "axios";

const API_URL = "http://localhost:8099";

const api = axios.create({
  baseURL: API_URL,
});

// Add interceptor for JWT if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const processLecture = async (
  file: Blob,
  title: string,
  s_lang: string = "English",
  f_lang: string = "English",
  q_lang: string = "English",
  subjectId?: number
) => {
  const formData = new FormData();
  formData.append("file", file, "lecture.webm");
  formData.append("title", title);
  formData.append("summary_language", s_lang);
  formData.append("flashcard_language", f_lang);
  formData.append("quiz_language", q_lang);
  if (subjectId) formData.append("subject_id", subjectId.toString());

  const response = await api.post("/lectures/process", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const processDocument = async (
  file: File,
  title: string,
  s_lang: string = "English",
  f_lang: string = "English",
  q_lang: string = "English",
  subjectId?: number
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("summary_language", s_lang);
  formData.append("flashcard_language", f_lang);
  formData.append("quiz_language", q_lang);
  if (subjectId) formData.append("subject_id", subjectId.toString());

  const response = await api.post("/lectures/process-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const processYoutubeLink = async (
  url: string,
  title: string,
  s_lang: string = "English",
  f_lang: string = "English",
  q_lang: string = "English",
  subjectId?: number
) => {
  const formData = new FormData();
  formData.append("youtube_url", url);
  formData.append("title", title);
  formData.append("summary_language", s_lang);
  formData.append("flashcard_language", f_lang);
  formData.append("quiz_language", q_lang);
  if (subjectId) formData.append("subject_id", subjectId.toString());

  const response = await api.post("/lectures/process-youtube", formData);
  return response.data;
};

export const renameLecture = async (id: number, title: string) => {
  const formData = new FormData();
  formData.append("title", title);
  const response = await api.patch(`/lectures/${id}/rename`, formData);
  return response.data;
};

export const getSubjects = async () => {
  const response = await api.get("/subjects/");
  return response.data;
};

export const createSubject = async (name: string) => {
  const response = await api.post("/subjects/", { name });
  return response.data;
};

export const deleteSubject = async (id: number) => {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
};

export const getLectures = async () => {
  const response = await api.get("/lectures/");
  return response.data;
};

export const updateLectureSubject = async (lectureId: number, subjectId: number | null) => {
  const formData = new FormData();
  if (subjectId !== null) {
    formData.append("subject_id", subjectId.toString());
  }
  const response = await api.patch(`/lectures/${lectureId}/subject`, formData);
  return response.data;
};

export const getLecture = async (id: string) => {
  const response = await api.get(`/lectures/${id}`);
  return response.data;
};

export const deleteLecture = async (id: string) => {
  const response = await api.delete(`/lectures/${id}`);
  return response.data;
};

export const updateLectureNotes = async (id: number, notes: string) => {
  const formData = new FormData();
  formData.append("notes", notes);
  const response = await api.patch(`/lectures/${id}/notes`, formData);
  return response.data;
};

export const generateLectureNotes = async (id: number) => {
  const response = await api.post(`/lectures/${id}/generate-notes`);
  return response.data;
};

export const generateLectureSummary = async (id: number) => {
  const response = await api.post(`/lectures/${id}/generate-summary`);
  return response.data;
};

export const generateLectureFlashcards = async (id: number) => {
  const response = await api.post(`/lectures/${id}/generate-flashcards`);
  return response.data;
};

export const generateLectureQuiz = async (id: number) => {
  const response = await api.post(`/lectures/${id}/generate-quiz`);
  return response.data;
};

export const updateWhiteboardData = async (id: number, data: any) => {
  const formData = new FormData();
  formData.append("whiteboard_data", JSON.stringify(data));
  const response = await api.patch(`/lectures/${id}/whiteboard`, formData);
  return response.data;
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/lectures/upload-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { url: string }
};

export const explainConcept = async (
  lectureId: number,
  concept: string,
  level: "simple" | "medium" | "detailed"
): Promise<{ explanation: string; analogy: string; key_insight: string; level: string }> => {
  const formData = new FormData();
  formData.append("concept", concept);
  formData.append("level", level);
  const response = await api.post(`/lectures/${lectureId}/explain`, formData);
  return response.data;
};

export const feynmanEvaluate = async (
  lectureId: number,
  userExplanation: string,
  concept: string = "the main topic of this lecture"
): Promise<{
  clarity_score: number;
  completeness_score: number;
  missing_points: string[];
  strong_points: string[];
  feedback: string;
  improved_version: string;
}> => {
  const formData = new FormData();
  formData.append("user_explanation", userExplanation);
  formData.append("concept", concept);
  const response = await api.post(`/lectures/${lectureId}/feynman`, formData);
  return response.data;
};

export const getKnowledgeGraph = async (): Promise<{
  nodes: { id: number; title: string; topic: string; group: number }[];
  edges: { source: number; target: number; label: string; strength: number }[];
}> => {
  const response = await api.get("/lectures/knowledge-graph");
  return response.data;
};
