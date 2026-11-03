import { render, screen } from '@testing-library/react';
import {
  EmptyState,
  ErrorAlert,
  Modal,
  ModalHeader,
  ModalPanel,
  PageHeader,
  Table,
  TableBody,
  TableHead,
  TableMessageRow,
  Th,
} from '@/components/ui';

describe('PageHeader', () => {
  it('renders title, description and actions', () => {
    render(<PageHeader title="Users" description="Manage users" actions={<button>Add</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders the panel and title when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <ModalPanel>
          <ModalHeader title="Add User" description="Create an account" />
        </ModalPanel>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add User' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <ModalPanel>hidden</ModalPanel>
      </Modal>
    );
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });
});

describe('Table', () => {
  it('renders header cells and a message row', () => {
    render(
      <Table>
        <TableHead>
          <Th>Task</Th>
        </TableHead>
        <TableBody>
          <TableMessageRow colSpan={1}>No logs found.</TableMessageRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('columnheader', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'No logs found.' })).toHaveAttribute('colspan', '1');
  });
});

describe('ErrorAlert', () => {
  it('is announced as an alert', () => {
    render(<ErrorAlert>Failed</ErrorAlert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });
});

describe('EmptyState', () => {
  it('omits the border when bordered is false', () => {
    const { container } = render(<EmptyState title="No Data" bordered={false} />);
    expect(container.firstChild).not.toHaveClass('border');
  });
});
