import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Modal } from '../Modal';

describe('Modal Integration Tests', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Rendering and Visibility', () => {
        it('рендерит модалку, когда isOpen=true', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div data-testid="modal-content">Modal Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-content')).toBeInTheDocument();
        });

        it('не отображает модалку, когда isOpen=false', () => {
            render(
                <Modal isOpen={false} onClose={mockOnClose}>
                    <div data-testid="modal-content">Modal Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-content')).toBeInTheDocument();
            expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
        });

        it('рендерит кнопку закрытия, когда передан onClose', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
        });

        it('не рендерит кнопку закрытия, когда onClose не передан', () => {
            render(
                <Modal isOpen={true}>
                    <div>Content</div>
                </Modal>
            );

            expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
        });
    });

    describe('Close Button Functionality', () => {
        it('должен вызывать onClose при клике на кнопку закрытия', async () => {
            const user = userEvent.setup();

            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            const closeButton = screen.getByTestId('modal-close-button');
            await user.click(closeButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Backdrop Click Functionality', () => {
        it('должен вызывать onClose при клике на backdrop', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>Content</div>
                </Modal>
            );

            const backdrop = screen.getByTestId('modal-backdrop');
            expect(backdrop).toBeInTheDocument();

            fireEvent.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('не должен вызывать onClose, когда кликнули на backdrop и onClose не передан', () => {
            render(
                <Modal isOpen={true}>
                    <div>Content</div>
                </Modal>
            );

            const backdrop = screen.getByTestId('modal-backdrop');
            fireEvent.click(backdrop!);

            expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
        });
    });

    describe('Event Propagation', () => {
        it('не должен вызывать onClose, когда кликнули на контент модалки', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div data-testid="modal-content">Content</div>
                </Modal>
            );

            const modalContent = screen.getByTestId('modal-content');
            fireEvent.click(modalContent);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('не должен вызывать onClose, когда кликнули на область модалки', () => {
            render(
                <Modal isOpen={true} onClose={mockOnClose}>
                    <div>
                        <button data-testid="inside-modal-button">Inside Modal Button</button>
                        <input data-testid="inside-modal-input" placeholder="Inside Modal Input" />
                    </div>
                </Modal>
            );

            fireEvent.click(screen.getByTestId('inside-modal-button'));
            fireEvent.click(screen.getByTestId('inside-modal-input'));

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Portal Integration', () => {
        it('рендерит модалку вне дерева компонентов через портал', () => {
            render(
                <div data-testid="app-root">
                    <Modal isOpen={true} onClose={mockOnClose}>
                        <div data-testid="modal-content">Portal Content</div>
                    </Modal>
                </div>
            );

            const appRoot = screen.getByTestId('app-root');
            const modalContent = screen.getByTestId('modal-content');

            expect(appRoot).not.toContainElement(modalContent);

            expect(modalContent).toBeInTheDocument();
        });
    });
});
