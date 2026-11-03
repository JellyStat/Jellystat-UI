import { AlertCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Button from '../primitives/Button';
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
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={() => onResult(false)}>
      <ModalPanel size="sm">
        <ModalHeader icon={<Icon size={22} />} iconTone={tone} title={title} />
        <p className="-mt-2 mb-6 text-sm text-gray-400 font-medium">{description}</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => onResult(false)}>
            {cancelText}
          </Button>
          <Button variant={tone} onClick={() => onResult(true)}>
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
