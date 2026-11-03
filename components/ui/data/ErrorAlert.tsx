import Alert, { type AlertProps } from './Alert';

export type ErrorAlertProps = Omit<AlertProps, 'tone'>;

// Shorthand for <Alert tone="danger">.
export default function ErrorAlert(props: ErrorAlertProps) {
  return <Alert tone="danger" {...props} />;
}
