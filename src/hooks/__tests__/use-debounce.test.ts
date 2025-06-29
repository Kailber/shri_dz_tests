import { renderHook } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

import { useDebounce } from '../use-debounce';

describe('useDebounce hook', () => {
    let mockFn: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFn = vi.fn();
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    describe('debounce с анимацией', () => {
        it('делает debounce вызовов функций с использованием requestAnimationFrame', async () => {
            const { result } = renderHook(() => useDebounce(mockFn));
            const debouncedFunction = result.current;

            debouncedFunction('once');
            debouncedFunction('twice');
            debouncedFunction('thrice');
            debouncedFunction('fourth');
            debouncedFunction('fifth');

            await new Promise((resolve) => setTimeout(resolve, 100)); // Ждем, чтобы убедиться, что функция не была вызвана сразу

            expect(mockFn).toHaveBeenCalledTimes(5);
            expect(mockFn).toHaveBeenNthCalledWith(1, 'once');
            expect(mockFn).toHaveBeenNthCalledWith(2, 'twice');
            expect(mockFn).toHaveBeenNthCalledWith(3, 'thrice');
            expect(mockFn).toHaveBeenNthCalledWith(4, 'fourth');
            expect(mockFn).toHaveBeenNthCalledWith(5, 'fifth');
        });

        it('должен обрабатывать вызовы по порядку', async () => {
            const { result } = renderHook(() => useDebounce(mockFn));
            const debouncedFunction = result.current;

            debouncedFunction('first');
            debouncedFunction('second');
            debouncedFunction('third');
            debouncedFunction('fourth');
            debouncedFunction('fifth');

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mockFn).toHaveBeenCalledTimes(5);
            expect(mockFn.mock.calls).toEqual([['first'], ['second'], ['third'], ['fourth'], ['fifth']]);
        });
    });

    describe('debounce с timeout', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('делает debounce вызовов функций с использованием setTimeout', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 100 }));
            const debouncedFunction = result.current;

            debouncedFunction('first');
            debouncedFunction('second');
            debouncedFunction('third');
            debouncedFunction('fourth');
            debouncedFunction('fifth');

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('first');

            vi.advanceTimersByTime(200);

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenNthCalledWith(3, 'third');

            vi.advanceTimersByTime(200);

            expect(mockFn).toHaveBeenCalledTimes(5);
            expect(mockFn).toHaveBeenNthCalledWith(5, 'fifth');
        });

        it('должен учитывать пользовательскую задержку', () => {
            const customDelay = 500;
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: customDelay }));
            const debouncedFunction = result.current;

            debouncedFunction('test');

            vi.advanceTimersByTime(customDelay - 1);
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledWith('test');
        });

        afterEach(() => {
            vi.useRealTimers();
        });
    });

    describe('очередь вызовов', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('должен обрабатывать вызовы из очереди по порядку', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 100 }));
            const debouncedFunction = result.current;

            debouncedFunction('first');
            debouncedFunction('second');
            debouncedFunction('third');
            debouncedFunction('fourth');
            debouncedFunction('fifth');

            vi.runAllTimers();

            expect(mockFn).toHaveBeenCalledTimes(5);
            expect(mockFn.mock.calls).toEqual([['first'], ['second'], ['third'], ['fourth'], ['fifth']]);
        });

        it('обрабатывает разные типы аргументов', () => {
            const { result } = renderHook(() => useDebounce(mockFn, { type: 'timeout', delay: 10 }));
            const debouncedFunction = result.current;

            debouncedFunction('string');
            debouncedFunction(100);
            debouncedFunction({ key: 'value' });

            vi.runAllTimers();

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenNthCalledWith(1, 'string');
            expect(mockFn).toHaveBeenNthCalledWith(2, 100);
            expect(mockFn).toHaveBeenNthCalledWith(3, { key: 'value' });
        });
    });
});
