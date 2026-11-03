import { act, fireEvent, render, screen } from '@testing-library/react';
import { ConfirmButton, NumberField, Select, StatusIndicator } from '@/components/ui';

describe('ConfirmButton', () => {
  it('runs onConfirm only after the dialog is confirmed', async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmButton
        title="Delete user?"
        description="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        onConfirm={onConfirm}
      >
        Remove
      </ConfirmButton>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Delete user?');
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('Select', () => {
  it('shows the selected label, or the placeholder', () => {
    const data = [{ value: 'a' }, { value: 'b' }];
    const { rerender } = render(
      <Select data={data} value="b" labelFn={(v) => v.toUpperCase()} placeholder="Pick" />
    );
    expect(screen.getByRole('button')).toHaveTextContent('B');

    rerender(<Select data={data} labelFn={(v) => v} placeholder="Pick" />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick');
  });
});

describe('NumberField', () => {
  it('clamps to min/max and debounces onChange', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<NumberField value={5} min={1} max={10} onChange={onChange} />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(onChange).toHaveBeenCalledWith(10);
    jest.useRealTimers();
  });
});

describe('StatusIndicator', () => {
  it('exposes a label when given', () => {
    render(<StatusIndicator tone="danger" label="Offline" />);
    expect(screen.getByRole('img', { name: 'Offline' })).toBeInTheDocument();
  });
});
