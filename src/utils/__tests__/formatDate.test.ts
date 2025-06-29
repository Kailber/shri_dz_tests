import { describe, it, expect } from 'vitest';
import { formatDate } from '../formateDate';

describe('formatDate utility', () => {
    it('форматирует объект Date корректно', () => {
        const date = new Date(1999, 11, 31); // Dec 31, 1999
        expect(formatDate(date)).toBe('31.12.1999');
    });

    it('formats timestamp number correctly', () => {
        const timestamp = 100000000; // Jan 2, 1970
        expect(formatDate(timestamp)).toBe('02.01.1970');
    });

    it('крайние случаи', () => {
        const timestamp = 0;
        const date = new Date(0);

        expect(formatDate(timestamp)).toBe('01.01.1970');
        expect(formatDate(date)).toBe('01.01.1970'); 
    });

    it('обрабатывает отрицательные даты', () => {
        const negativeTimestamp = -1; // Таймстамп, недостаточно отрицательный для перехода в 1969 год
        const theDayBefore = -50000000; // Таймстамп для 31 декабря 1969 года

        expect(formatDate(negativeTimestamp)).toBe('01.01.1970'); // Возвращает 01.01.1970 для отрицательного таймстампа
        expect(formatDate(theDayBefore)).toBe('31.12.1969'); // Возвращает 31.12.1969 для отрицательного таймстампа
    });
});