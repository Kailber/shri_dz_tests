import { renderHook } from '@testing-library/react';
import { transformAnalysisData } from '@utils/analysis';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { useCsvAnalysis } from '../use-csv-analysis';

describe('useCsvAnalysis hook', () => {
    let mockOnData: ReturnType<typeof vi.fn>;
    let mockOnError: ReturnType<typeof vi.fn>;
    let mockOnComplete: ReturnType<typeof vi.fn>;
    let mockFile: File;

    beforeEach(() => {
        mockOnData = vi.fn();
        mockOnError = vi.fn();
        mockOnComplete = vi.fn();
        mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    describe('поведение хука с колбэками', () => {
        it('с корректными данными должен отрабатывать fetch', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: { getReader: () => ({ read: () => Promise.resolve({ done: true }) }) },
            } as unknown as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ onData: mockOnData, onError: mockOnError, onComplete: mockOnComplete })
            );

            await result.current.analyzeCsv(mockFile);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/aggregate?rows=10000'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
        });

        it('должен вызывать onError при ошибке fetch', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => 
                useCsvAnalysis({ 
                    onData: mockOnData, 
                    onError: mockOnError, 
                    onComplete: mockOnComplete 
                })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );

            expect(mockOnData).not.toHaveBeenCalled();
            expect(mockOnComplete).not.toHaveBeenCalled();
        });

        it('когда у ответа нет тела, должен вызывать onError', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: null,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ 
                    onData: mockOnData, 
                    onError: mockOnError, 
                    onComplete: mockOnComplete 
                })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );
        });

        it('когда плохой ответ, должен вызывать onError', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                body: {} as ReadableStream,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ 
                    onData: mockOnData, 
                    onError: mockOnError, 
                    onComplete: mockOnComplete 
                })
            );

            await result.current.analyzeCsv(mockFile);

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Неизвестная ошибка парсинга :(',
                })
            );
        });
    });

    describe('валидация колбэков', () => {
        it('должен создавать функцию analyzeCsv', () => {
            const { result } = renderHook(() =>
                useCsvAnalysis({ 
                    onData: mockOnData, 
                    onError: mockOnError, 
                    onComplete: mockOnComplete 
                })
            );

            expect(result.current).toHaveProperty('analyzeCsv');
            expect(typeof result.current.analyzeCsv).toBe('function');
        });

        it('должен вызывать onData и onComplete при успешном анализе', async () => {
            
            // Mock ответа сервера
            const serverResponseData = {
                total_spend_galactic: 100,
                rows_affected: 1,
                less_spent_at: 2,
                big_spent_at: 3,
                less_spent_value: 4,
                big_spent_value: 5,
                average_spend_galactic: 6,
                big_spent_civ: 'monsters',
                less_spent_civ: 'humans',
            };

            const responseJson = JSON.stringify(serverResponseData);
            const uint8Array = new TextEncoder().encode(responseJson + '\n');

            const mockReader = {
                read: vi
                    .fn()
                    .mockResolvedValueOnce({ done: false, value: uint8Array })
                    .mockResolvedValueOnce({ done: true, value: undefined }),
            };

            const mockStream = {
                getReader: vi.fn().mockReturnValue(mockReader),
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                body: mockStream as unknown as ReadableStream,
            } as Response);

            const { result } = renderHook(() =>
                useCsvAnalysis({ 
                    onData: mockOnData, 
                    onError: mockOnError, 
                    onComplete: mockOnComplete 
                })
            );

            await result.current.analyzeCsv(mockFile);

            const { highlights: highlightsFromApi, highlightsToStore } = transformAnalysisData(uint8Array);
            expect(mockOnData).toHaveBeenCalledWith(highlightsToStore);
            expect(mockOnComplete).toHaveBeenCalledWith(highlightsFromApi);
        });
    });
});
