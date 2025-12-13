import { useState, useCallback } from "react";
import type { PracticeEntry } from "../types/lesson";

interface UseEntryDialogsOptions {
  onEdit?: (id: string, payload: { pinyin: string; english: string }) => Promise<void> | void;
  onDelete?: (id: string) => void;
}

export function useEntryDialogs({ onEdit, onDelete }: UseEntryDialogsOptions) {
  const [editingEntry, setEditingEntry] = useState<PracticeEntry | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<PracticeEntry | null>(null);

  const handleOpenEditDialog = useCallback((entry: PracticeEntry) => {
    setEditingEntry(entry);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditingEntry(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (payload: { pinyin: string; english: string }) => {
      if (!editingEntry || !onEdit) return;
      setIsSavingEdit(true);
      try {
        await onEdit(editingEntry.id, payload);
        setEditingEntry(null);
      } finally {
        setIsSavingEdit(false);
      }
    },
    [editingEntry, onEdit]
  );

  const handleOpenDeleteDialog = useCallback((entry: PracticeEntry) => {
    setDeletingEntry(entry);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeletingEntry(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingEntry && onDelete) {
      onDelete(deletingEntry.id);
      setDeletingEntry(null);
    }
  }, [deletingEntry, onDelete]);

  return {
    // Edit dialog state
    editingEntry,
    isSavingEdit,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleSaveEdit,
    // Delete dialog state
    deletingEntry,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleConfirmDelete,
  };
}
