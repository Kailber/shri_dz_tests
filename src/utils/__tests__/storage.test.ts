import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHistory, addToHistory, removeFromHistory, clearHistory } from '../storage';
import { STORAGE_KEY } from '../consts';

describe('storage utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getHistory возвращает пустой массив при отсутствии данных', () => {
        vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
        
        expect(getHistory()).toEqual([]);
    });

    it('getHistory возвращает массив из сохраненных данных', () => {
        const arr = [{ id: '1', timestamp: 0, fileName: 'f' }];
        
        vi.spyOn(window.localStorage, 'getItem').mockReturnValue(JSON.stringify(arr));
        
        expect(getHistory()).toEqual(arr);
    });

    it('addToHistory добавляет новый элемент', () => {
        vi.spyOn(window.localStorage, 'getItem').mockReturnValue(JSON.stringify([]));
        vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid');
        vi.spyOn(Date, 'now').mockReturnValue(123);
        
        const newItem = addToHistory({ fileName: 'file', highlights: [] });
        
        expect(newItem).toEqual({ id: 'uuid', timestamp: 123, fileName: 'file', highlights: [] });
        expect(window.localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([newItem]));
    });

    it('removeFromHistory фильтрует элементы по id', () => {
        const existing = [
            { id: '1', timestamp: 0, fileName: 'f' },
            { id: '2', timestamp: 1, fileName: 'g' },
        ];
        
        vi.spyOn(window.localStorage, 'getItem').mockReturnValue(JSON.stringify(existing));
        
        removeFromHistory('1');

        expect(window.localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([existing[1]]));
    });

    it('clearHistory удаляет ключ', () => {
        clearHistory();
        
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
});