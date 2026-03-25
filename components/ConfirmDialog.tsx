'use client';

import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-zinc-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-surface-light hover:bg-surface-lighter border border-border text-zinc-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
        >
          Excluir
        </button>
      </div>
    </Modal>
  );
}
