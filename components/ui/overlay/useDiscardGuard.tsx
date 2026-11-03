import { useEffect, useRef, useState, type ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

export type DiscardGuardLabels = {
  title: ReactNode;
  description: ReactNode;
  discard: ReactNode;
  keepEditing: ReactNode;
};

// Escape closes a form modal, asking first when there are unsaved edits.
// Call it from the component inside the Modal (mounted only while open) and render `dialog`.
export default function useDiscardGuard({
  dirty,
  onClose,
  labels,
}: {
  dirty: boolean;
  onClose: () => void;
  labels: DiscardGuardLabels;
}) {
  const [asking, setAsking] = useState(false);

  function requestClose() {
    if (dirty) setAsking(true);
    else onClose();
  }

  // On window, not the panel: focus can sit on <body> when the modal opens.
  const latest = useRef({ asking, requestClose });
  latest.current = { asking, requestClose };
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // While the confirm dialog is up, Escape belongs to it.
      if (e.key !== 'Escape' || latest.current.asking) return;
      latest.current.requestClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const dialog = (
    <ConfirmDialog
      open={asking}
      onResult={(confirmed) => {
        setAsking(false);
        if (confirmed) onClose();
      }}
      title={labels.title}
      description={labels.description}
      confirmText={labels.discard}
      cancelText={labels.keepEditing}
      tone="danger"
    />
  );

  return { requestClose, dialog };
}
