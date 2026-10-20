import * as React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { AlertTriangle, Lock } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  requireTypedText?: string;
  requirePasswordConfirm?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  requireTypedText,
  requirePasswordConfirm,
}) => {
  const [typedInput, setTypedInput] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTypedInput('');
      setPasswordInput('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (requireTypedText && typedInput.trim() !== requireTypedText) {
      setError(`Please type "${requireTypedText}" exactly to proceed.`);
      return;
    }
    if (requirePasswordConfirm && passwordInput.length < 4) {
      setError('Please provide administrative authentication credentials.');
      return;
    }
    setError('');
    onConfirm();
  };

  const isButtonDisabled =
    (requireTypedText && typedInput.trim() !== requireTypedText) ||
    (requirePasswordConfirm && !passwordInput.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start gap-4">
        <div
          className={`p-3 rounded-full shrink-0 ${
            isDestructive
              ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
          }`}
        >
          {requirePasswordConfirm ? <Lock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="space-y-2 flex-1">
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {requireTypedText && (
            <div className="pt-2 text-left">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Type <span className="font-mono font-bold text-foreground">{requireTypedText}</span> below to confirm:
              </label>
              <Input
                value={typedInput}
                onChange={e => setTypedInput(e.target.value)}
                placeholder={requireTypedText}
                className="font-mono text-sm"
              />
            </div>
          )}

          {requirePasswordConfirm && (
            <div className="pt-2 text-left">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Admin Re-authentication Password:
              </label>
              <Input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-medium text-left">{error}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border/60">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDestructive ? 'destructive' : 'primary'}
          onClick={handleConfirm}
          isLoading={isLoading}
          disabled={Boolean(isButtonDisabled)}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
