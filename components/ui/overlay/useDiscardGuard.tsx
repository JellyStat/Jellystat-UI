import { useState, type KeyboardEvent, type ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

export type DiscardGuardLabels = {
  title: ReactNode;
  description: ReactNode;
  discard: ReactNode;
  keepEditing: ReactNode;
};

// Escape closes a form modal, asking first when there are unsaved edits.
// Spread `onKeyDown` on the ModalPanel and render `dialog` inside it.
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

  function onKeyDown(e: KeyboardEvent) {
    // The confirm dialog handles its own Escape (keydown bubbles here through the portal).
    if (e.key !== 'Escape' || asking || e.defaultPrevented) return;
    e.preventDefault();
    requestClose();
  }

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

  return { onKeyDown, requestClose, dialog };
}
