import { describe, it, expect } from 'vitest';
import { createPersistConfig } from '../persist';

describe('createPersistConfig', () => {
    interface State { a: number; b: string; c: boolean }
    
    const config = createPersistConfig<State>('test', ['a', 'c']);

    it('возвращает корректное имя', () => {
        expect(config.name).toBe('test');
    });

    it('фильтрует ключи', () => {
        const state = { a: 1, b: 'two', c: true };
        const partial = config.partialize!(state);
        
        expect(partial).toEqual({ a: 1, c: true });
    });
});