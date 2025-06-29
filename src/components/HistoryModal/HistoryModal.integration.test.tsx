import { HistoryItemType } from '@app-types/history';
import { useHistoryStore } from '@store/historyStore';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryModal } from '../HistoryModal';

/**
 * Integration Test for HistoryModal Component
 *
 * Tests the modal integration with Zustand store:
 * - Modal visibility based on store state
 * - Selected item display and data transformation
 * - Modal close functionality
 * - Store state synchronization
 * - Highlight cards rendering
 */

describe('HistoryModal Интеграционные тесты', () => {
    const mockHistoryItem: HistoryItemType = {
        id: 'test-id-1',
        fileName: 'test-data.csv',
        timestamp: Date.now(),
        highlights: {
            total_spend_galactic: 100,
            rows_affected: 1,
            less_spent_at: 2,
            big_spent_at: 3,
            less_spent_value: 4,
            big_spent_value: 5,
            average_spend_galactic: 6,
            big_spent_civ: 'monsters',
            less_spent_civ: 'humans',
        },
    };

    beforeEach(() => {
        localStorage.clear();

        act(() => {
            const store = useHistoryStore.getState();
            store.hideModal();
            store.resetSelectedItem();
            store.clearHistory();
        });

        document.body.innerHTML = '';
    });

    describe('Modal Visibility', () => {
        it('модалка не рендерится при isOpenModal=false', () => {
            render(<HistoryModal/ >);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('модалка не рендерится, если нет выбранного элемента', () => {
            act(() => {
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('модалка рендерится, когда isOpenModal=true и выбранный элемент существует', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByTestId('history-modal-content')).toBeInTheDocument();
        });
    });

    describe('Store Integration', () => {
        it('корректно отображает данные выбранного элемента', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByText('100')).toBeInTheDocument();
            expect(screen.getByText('Общие расходы')).toBeInTheDocument();
            expect(screen.getByText('monsters')).toBeInTheDocument();
            expect(screen.getByText('humans')).toBeInTheDocument();
        });

        it('должен вызывать hideModal при закрытии модалки', async () => {
            const user = userEvent.setup();

            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(useHistoryStore.getState().isOpenModal).toBe(true);

            const closeButton = screen.getByTestId('modal-close-button');
            await user.click(closeButton);

            expect(useHistoryStore.getState().isOpenModal).toBe(false);
        });

        it('должен обрабатывать преобразование с помощью convertHighlightsToArray', () => {
            const itemWithHighlights = {
                ...mockHistoryItem,
                highlights: {
                    total_spend_galactic: 2500,
                    average_spend_galactic: 125,
                    big_spent_civ: 'people',
                    less_spent_civ: 'demons',
                    rows_affected: 200,
                    less_spent_at: 5,
                    big_spent_at: 350,
                    less_spent_value: 25,
                    big_spent_value: 800,
                },
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithHighlights);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByText('2500')).toBeInTheDocument();
            expect(screen.getByText('125')).toBeInTheDocument();
            expect(screen.getByText('people')).toBeInTheDocument();
            expect(screen.getByText('demons')).toBeInTheDocument();
        });
    });

    describe('Highlight Cards Display', () => {
        it('правильно отображает карточки с хайлайтами', () => {
            act(() => {
                useHistoryStore.getState().setSelectedItem(mockHistoryItem);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            const descriptions = [
                'Общие расходы',
                'День min расходов',
                'День max расходов',
                'Min расходы в день',
                'Max расходы в день',
                'Средние расходы',
                'Цивилизация max расходов',
                'Цивилизация min расходов',
            ];

            descriptions.forEach((description) => {
                expect(screen.getByText(description)).toBeInTheDocument();
            });
        });

        it('обрабатывает отсутствие хайлайтов', () => {
            const itemWithoutHighlights = {
                ...mockHistoryItem,
                highlights: undefined,
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithoutHighlights);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.queryByTestId('history-modal-content')).not.toBeInTheDocument();
        });

        it('должен отображать числовые значения как строки', () => {
            const itemWithNumbers = {
                ...mockHistoryItem,
                highlights: {
                    ...mockHistoryItem.highlights!,
                    total_spend_galactic: 12,
                    average_spend_galactic: 142.77,
                },
            };

            act(() => {
                useHistoryStore.getState().setSelectedItem(itemWithNumbers);
                useHistoryStore.getState().showModal();
            });

            render(<HistoryModal />);

            expect(screen.getByText('12')).toBeInTheDocument();
            expect(screen.getByText('143')).toBeInTheDocument();
        });
    });
});
