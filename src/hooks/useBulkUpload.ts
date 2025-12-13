import { useCallback, useState } from "react";
import type { Lesson } from "../types/lesson";

export interface UseBulkUploadOptions {
  lessonId: string | null;
  ensureEditable: () => boolean;
  setLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
}

export interface UseBulkUploadReturn {
  // Dialog state
  isDialogOpen: boolean;
  isUploading: boolean;
  error: string | null;
  successMessage: string | null;
  counts: { vocabulary: number; sentences: number } | null;
  filename: string | null;

  // Dialog handlers
  handleOpenDialog: () => void;
  handleCloseDialog: () => void;

  // Upload handlers
  handleFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleJsonPasted: (jsonText: string) => void;
}

/**
 * Normalizes a bulk entry, validating required fields.
 */
const normalizeBulkEntry = (
  entry: unknown,
  index: number,
  label: "vocabulary" | "sentences"
): { pinyin: string; english: string; audioUrl?: string } => {
  if (!entry || typeof entry !== "object") {
    throw new Error(`Invalid ${label} entry at index ${index}.`);
  }
  const record = entry as Record<string, unknown>;
  const pinyin =
    typeof record.pinyin === "string" ? record.pinyin.trim() : "";
  const english =
    typeof record.english === "string" ? record.english.trim() : "";
  const audioUrl =
    typeof record.audioUrl === "string" ? record.audioUrl.trim() : "";

  if (!pinyin || !english) {
    throw new Error(
      `Missing pinyin or english for ${label} entry at index ${index}.`
    );
  }

  return audioUrl ? { pinyin, english, audioUrl } : { pinyin, english };
};

export function useBulkUpload(
  options: UseBulkUploadOptions
): UseBulkUploadReturn {
  const { lessonId, ensureEditable, setLesson } = options;

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [counts, setCounts] = useState<{
    vocabulary: number;
    sentences: number;
  } | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // Dialog handlers
  const handleOpenDialog = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setCounts(null);
    setFilename(null);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (isUploading) {
      return;
    }
    setIsDialogOpen(false);
  }, [isUploading]);

  // Core upload logic
  const handleBulkUploadContent = useCallback(
    async (rawText: string, sourceLabel: string) => {
      if (!lessonId) {
        setError("Lesson id missing");
        return;
      }

      if (!ensureEditable()) {
        return;
      }

      setError(null);
      setSuccessMessage(null);
      setCounts(null);
      setFilename(sourceLabel);
      setIsUploading(true);

      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error("JSON content must be valid.");
        }

        if (!parsed || typeof parsed !== "object") {
          throw new Error(
            "JSON must be an object with vocabulary and/or sentences arrays."
          );
        }

        const vocabularyInput = Array.isArray(
          (parsed as { vocabulary?: unknown[] }).vocabulary
        )
          ? (parsed as { vocabulary: unknown[] }).vocabulary ?? []
          : [];
        const sentencesInput = Array.isArray(
          (parsed as { sentences?: unknown[] }).sentences
        )
          ? (parsed as { sentences: unknown[] }).sentences ?? []
          : [];

        if (!vocabularyInput.length && !sentencesInput.length) {
          throw new Error(
            "Include at least one vocabulary or sentence entry in the JSON."
          );
        }

        const normalizedVocabulary = vocabularyInput.map((entry, index) =>
          normalizeBulkEntry(entry, index, "vocabulary")
        );
        const normalizedSentences = sentencesInput.map((entry, index) =>
          normalizeBulkEntry(entry, index, "sentences")
        );

        const response = await fetch(`/api/lessons/${lessonId}/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabulary: normalizedVocabulary,
            sentences: normalizedSentences,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Bulk upload failed");
        }

        const data = await response.json();
        const createdVocabulary = Array.isArray(data?.created?.vocabulary)
          ? (data.created.vocabulary as Array<{
              id: string;
              pinyin: string;
              english: string;
              audioUrl?: string | null;
            }>)
          : [];
        const createdSentences = Array.isArray(data?.created?.sentences)
          ? (data.created.sentences as Array<{
              id: string;
              pinyin: string;
              english: string;
              audioUrl?: string | null;
            }>)
          : [];

        setLesson((prev) => {
          if (!prev) return prev;

          const nextVocabulary = createdVocabulary.length
            ? [
                ...prev.vocabulary,
                ...createdVocabulary.map((entry) => ({
                  id: entry.id,
                  pinyin: entry.pinyin,
                  english: entry.english,
                  audioUrl: entry.audioUrl ?? undefined,
                })),
              ]
            : prev.vocabulary;

          const nextSentences = createdSentences.length
            ? [
                ...prev.sentences,
                ...createdSentences.map((entry) => ({
                  id: entry.id,
                  pinyin: entry.pinyin,
                  english: entry.english,
                  audioUrl: entry.audioUrl ?? undefined,
                })),
              ]
            : prev.sentences;

          return {
            ...prev,
            vocabulary: nextVocabulary,
            sentences: nextSentences,
          };
        });

        const vocabCount =
          typeof data?.counts?.vocabulary === "number"
            ? data.counts.vocabulary
            : createdVocabulary.length;
        const uploadSentenceCount =
          typeof data?.counts?.sentences === "number"
            ? data.counts.sentences
            : createdSentences.length;

        setCounts({
          vocabulary: vocabCount,
          sentences: uploadSentenceCount,
        });
        setSuccessMessage(
          `Imported ${vocabCount} vocabulary entr${
            vocabCount === 1 ? "y" : "ies"
          } and ${uploadSentenceCount} sentence${
            uploadSentenceCount === 1 ? "" : "s"
          }.`
        );
      } catch (err) {
        console.error("Bulk upload failed", err);
        setError((err as Error).message || "Bulk upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [ensureEditable, lessonId, setLesson]
  );

  // File selection handler
  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!ensureEditable()) {
        return;
      }
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      const fileText = await file.text();
      handleBulkUploadContent(fileText, file.name);
    },
    [ensureEditable, handleBulkUploadContent]
  );

  // JSON paste handler
  const handleJsonPasted = useCallback(
    (jsonText: string) => {
      if (!ensureEditable()) {
        return;
      }
      handleBulkUploadContent(jsonText, "Pasted JSON");
    },
    [ensureEditable, handleBulkUploadContent]
  );

  return {
    // Dialog state
    isDialogOpen,
    isUploading,
    error,
    successMessage,
    counts,
    filename,

    // Dialog handlers
    handleOpenDialog,
    handleCloseDialog,

    // Upload handlers
    handleFileSelected,
    handleJsonPasted,
  };
}
