import { AlertCircle, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import Label from '../primitives/Label';
import Modal, { ModalFooter, ModalHeader, ModalPanel } from './Modal';

export type ConfirmTone = 'primary' | 'accent' | 'danger';

export type ConfirmDialogProps = {
  open: boolean;
  // Called with true on confirm, false on cancel or dismiss.
  onResult: (confirmed: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmText: ReactNode;
  cancelText: ReactNode;
  icon?: LucideIcon;
  tone?: ConfirmTone;
  // For actions that can't be undone: the confirm button stays disabled until this text is typed.
  confirmPhrase?: { text: string; label: ReactNode };
};

export default function ConfirmDialog({
  open,
  onResult,
  title,
  description,
  confirmText,
  cancelText,
  icon: Icon = AlertCircle,
  tone = 'primary',
  confirmPhrase,
}: ConfirmDialogProps) {
  const inputId = useId();
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);
  const blocked = !!confirmPhrase && typed.trim().toLowerCase() !== confirmPhrase.text.toLowerCase();

  return (
    <Modal open={open} onClose={() => onResult(false)}>
      <ModalPanel size="sm">
        <ModalHeader icon={<Icon size={22} />} iconTone={tone} title={title} />
        <p className="-mt-2 mb-6 text-sm text-gray-400 font-medium">{description}</p>
        {confirmPhrase && (
          <div className="-mt-2 mb-6 space-y-1.5">
            <Label htmlFor={inputId}>{confirmPhrase.label}</Label>
            <Input
              id={inputId}
              value={typed}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => onResult(false)}>
            {cancelText}
          </Button>
          <Button variant={tone} disabled={blocked} onClick={() => onResult(true)}>
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
