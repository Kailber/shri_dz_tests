import { HistoryItemType } from '@app-types/history';
import { HistoryList } from '@components/HistoryList';
import { useHistoryStore } from '@store/historyStore';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addToHistory, clearHistory, getHistory, removeFromHistory } from '@utils/storage';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HistoryList Integration Tests', () => {
    const mockHistoryItem1: HistoryItemType = {
        id: 'test-id-1',
        fileName: 'sales-data.csv',
        timestamp: Date.now() - 1000,
        highlights: {
            total_spend_galactic: 1000,
            rows_affected: 100,
            less_spent_at: 2,
            big_spent_at: 150,
            less_spent_value: 20,
            big_spent_value: 600,
            average_spend_galactic: 75,
            big_spent_civ: 'people',
            less_spent_civ: 'elves',
        },
    };

    const mockHistoryItem2: HistoryItemType = {
        id: 'test-id-2',
        fileName: 'market-analysis.csv',
        timestamp: Date.now(),
        highlights: {
            total_spend_galactic: 1500,
            rows_affected: 200,
            less_spent_at: 1,
            big_spent_at: 365,
            less_spent_value: 40,
            big_spent_value: 1500,
            average_spend_galactic: 150,
            big_spent_civ: 'humans',
            less_spent_civ: 'aliens',
        },
    };

    beforeEach(() => {
        clearHistory();

        act(() => {
            const store = useHistoryStore.getState();
            store.hideModal();
            store.resetSelectedItem();
            store.clearHistory();
        });
    });

    describe('Initial Load and Synchronization', () => {
        it('грузит историю из localStorage при монтировании', async () => {
            addToHistory({
                fileName: 'sales-data.csv',
                highlights: mockHistoryItem1.highlights,
            });
            addToHistory({
                fileName: 'market-analysis.csv',
                highlights: mockHistoryItem2.highlights,
            });

            const history = getHistory();
            console.log(history);

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });
        });

        it('отображает состояние пустого списка, когда история отсутствует', () => {
            render(<HistoryList />);

            expect(screen.queryByText('.csv')).not.toBeInTheDocument();
        });

        it('синхронизирует состояние хранилища с данными localStorage', async () => {
            addToHistory({
                fileName: 'sales-data.csv',
                highlights: mockHistoryItem1.highlights,
            });

            render(<HistoryList />);

            await waitFor(() => {
                const history = getHistory();

                expect(history).toHaveLength(1);
                expect(history[0].fileName).toBe('sales-data.csv');
                expect(history[0].id).toMatch(/^test-uuid-/);
            });
        });
    });

    describe('Store Integration', () => {
        it('обновляет отображение при изменении истории хранилища', async () => {
            render(<HistoryList />);

            expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                useHistoryStore.getState().updateHistoryFromStorage();
            });

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
            });
        });

        it('вызывает updateHistoryFromStorage при монтировании', async () => {
            const spy = vi.spyOn(useHistoryStore.getState(), 'updateHistoryFromStorage');

            render(<HistoryList />);

            await waitFor(() => {
                expect(spy).toHaveBeenCalled();
            });

            spy.mockRestore();
        });

        it('немедленно отражает изменения состояния хранилища', async () => {
            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });

                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            const history = getHistory();
            const firstItemId = history[0].id;
            const firstItemFileName = history[0].fileName;

            act(() => {
                removeFromHistory(firstItemId);
                useHistoryStore.getState().updateHistoryFromStorage();
            });

            await waitFor(() => {
                if (firstItemFileName === 'sales-data.csv') {
                    expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();
                    expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
                } else {
                    expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                    expect(screen.queryByText('market-analysis.csv')).not.toBeInTheDocument();
                }
            });
        });
    });

    describe('Item Interactions', () => {
        it('открывает модалку с правильными данными при клике на элемент', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            expect(historyItem).toBeDefined();

            const clickableButton = screen.getByTestId(`open-button-${historyItem!.id}`);
            expect(clickableButton).toBeInTheDocument();

            await user.click(clickableButton);

            await waitFor(() => {
                expect(useHistoryStore.getState().isOpenModal).toBe(true);
            });
        });

        it('обрабатывает клики по различным элементам корректно', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            if (historyItem) {
                const clickableButton = screen.getByTestId(`open-button-${historyItem.id}`);
                expect(clickableButton).toBeInTheDocument();

                await user.click(clickableButton);
                expect(useHistoryStore.getState().selectedItem?.id).toBe(historyItem.id);
            }

            const historyItem2 = history.find((item) => item.fileName === 'market-analysis.csv');

            if (historyItem2) {
                const clickableButton2 = screen.getByTestId(`open-button-${historyItem2.id}`);
                expect(clickableButton2).toBeInTheDocument();

                await user.click(clickableButton2);
                expect(useHistoryStore.getState().selectedItem?.id).toBe(historyItem2.id);
            }
        });
    });

    describe('Item Deletion', () => {
        it('удаляет элемент как из хранилища, так и из состояния при удалении', async () => {
            const user = userEvent.setup();

            act(() => {
                addToHistory({
                    fileName: 'sales-data.csv',
                    highlights: mockHistoryItem1.highlights,
                });
                addToHistory({
                    fileName: 'market-analysis.csv',
                    highlights: mockHistoryItem2.highlights,
                });
            });

            render(<HistoryList />);

            await waitFor(() => {
                expect(screen.getByText('sales-data.csv')).toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            });

            const history = getHistory();

            const historyItem = history.find((item) => item.fileName === 'sales-data.csv');

            if (historyItem) {
                const deleteButton = screen.getByTestId(`delete-button-${historyItem.id}`);

                await user.click(deleteButton);

                await waitFor(() => {
                    expect(useHistoryStore.getState().history).toHaveLength(1);
                    useHistoryStore.getState().updateHistoryFromStorage();
                });

                expect(screen.queryByText('sales-data.csv')).not.toBeInTheDocument();
                expect(screen.getByText('market-analysis.csv')).toBeInTheDocument();
            }
        });
    });

    describe('Error Handling', () => {
        it('обрабатывает поврежденные данные localStorage', async () => {
            act(() => {
                localStorage.setItem('tableHistory', 'invalid json');
            });

            expect(() => render(<HistoryList />)).not.toThrow();
        });

        it('обрабатывает отсутствие данных элемента корректно', () => {
            const incompleteItem = {
                highlights: {},
                fileName: 'sales-data.csv',
            } as HistoryItemType;

            act(() => {
                addToHistory(incompleteItem);
            });

            expect(() => render(<HistoryList />)).not.toThrow();
        });
    });
});
