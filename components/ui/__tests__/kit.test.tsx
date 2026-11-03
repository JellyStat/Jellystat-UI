import { render, screen } from '@testing-library/react';
import { Badge, Button, Field, Input, cn } from '@/components/ui';

describe('cn', () => {
  it('lets later classes override custom theme tokens', () => {
    expect(cn('bg-surface text-brand-rose', 'bg-background text-brand-cyan')).toBe(
      'bg-background text-brand-cyan'
    );
    expect(cn('text-[11px] text-brand-rose')).toBe('text-[11px] text-brand-rose');
  });
});

describe('Button', () => {
  it('applies variant and size and lets className override', () => {
    render(
      <Button variant="outline" size="sm" className="px-6">
        Go
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('bg-surface', 'py-1.5', 'px-6');
    expect(button).not.toHaveClass('px-3');
  });

  it('disables itself while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

describe('Input', () => {
  it('pads for icons and shows the error state', () => {
    render(<Input leftIcon={<span />} rightSlot={<span />} error placeholder="name" />);
    const input = screen.getByPlaceholderText('name');
    expect(input).toHaveClass('pl-11', 'pr-12', 'border-brand-rose');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Field', () => {
  it('renders the error only when given', () => {
    const { rerender } = render(
      <Field label="Username" error="Required">
        <input />
      </Field>
    );
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();

    rerender(
      <Field label="Username">
        <input />
      </Field>
    );
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('uses tone classes', () => {
    render(<Badge tone="rose">Admin</Badge>);
    expect(screen.getByText('Admin')).toHaveClass('text-brand-rose');
  });
});
