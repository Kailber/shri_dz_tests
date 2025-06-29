import { describe, it, expect } from 'vitest';
import {
    transformAnalysisData,
    convertHighlightsToArray,
    isCsvFile,
    validateServerResponse,
    InvalidServerResponseError,
} from '../analysis';
import { HIGHLIGHT_TITLES } from '@utils/consts';

describe('analysis utility', () => {
    describe('transformAnalysisData', () => {
        it('корректно преобразует валидные данные', () => {
            const validData = {
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
            const mockValue = new TextEncoder().encode(JSON.stringify(validData) + '\n');
            const result = transformAnalysisData(mockValue);

            expect(result.highlightsToStore[0]).toEqual({
                title: '100',
                description: 'Общие расходы',
            });
        });

        it('выбрасывает InvalidServerResponseError при невалидных данных', () => {
            const invalidData = {
                another_field: 'value',
                another_one: 123,
            };

            const mockValue = new TextEncoder().encode(JSON.stringify(invalidData) + '\n');

            expect(() => transformAnalysisData(mockValue)).toThrow(InvalidServerResponseError);
            expect(() => transformAnalysisData(mockValue)).toThrow('Файл не был корректно обработан на сервере :(');
        });

        it('выбрасывает InvalidServerResponseError при пустом ответе', () => {
            const emptyData = {};
            const mockValue = new TextEncoder().encode(JSON.stringify(emptyData) + '\n');

            expect(() => transformAnalysisData(mockValue)).toThrow(InvalidServerResponseError);
            expect(() => transformAnalysisData(mockValue)).toThrow('Файл не был корректно обработан на сервере :(');
        });
    });

    describe('isCsvFile', () => {
        it('определяет файл csv', () => {
            const csv = new File([], 'data.csv');
            expect(isCsvFile(csv)).toBe(true);
        });

        it('возвращает false для не csv файлов', () => {
            const txt = new File([], 'example.txt');
            const md = new File([], 'example.md');
            const json = new File([], 'data.json');

            expect(isCsvFile(txt)).toBe(false);
            expect(isCsvFile(md)).toBe(false);
            expect(isCsvFile(json)).toBe(false);
        });
    });
    
    describe('validateServerResponse', () => {
        const validKey1 = Object.keys(HIGHLIGHT_TITLES)[0];
        const validKey2 = Object.keys(HIGHLIGHT_TITLES)[1];

        it('должен возвращать true для валидного highlight response', () => {
            const validResponse = {
                [validKey1]: 100,
                [validKey2]: 3,
            };
            
            expect(validateServerResponse(validResponse)).toBe(true);
        });

        it('возвращает false при отсутствии валидных highlight keys', () => {
            const invalidData = {
                someKey: 'value',
                someOtherKey: 123,
            };

            expect(validateServerResponse(invalidData)).toBe(false);
        });

        it('возвращает true при наличии хотя бы одного валидного ключа', () => {
            const data = {
                [validKey1]: 10,
                someKey: 'value'
            };
            expect(validateServerResponse(data)).toBe(true);
        });

        it('выбрасывает InvalidServerResponseError когда какое-либо значение равно null, даже если есть валидные ключи', () => {
            const rawWithNullValid = {
                [validKey1]: null,
                [validKey2]: 3,
                } as any;
            
                expect(() => validateServerResponse(rawWithNullValid)).toThrow(InvalidServerResponseError);
        });
    });

    describe('convertHighlightsToArray', () => {
        it('преобразует объект highlights в массив объектов Highlight', () => {
            const highlights = {
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

            const result = convertHighlightsToArray(highlights);

            expect(result).toEqual([
                { title: '100', description: 'Общие расходы' },
                { title: '1', description: 'Обработано строк' },
                { title: '2', description: 'День min расходов' },
                { title: '3', description: 'День max расходов' },
                { title: '4', description: 'Min расходы в день' },
                { title: '5', description: 'Max расходы в день' },
                { title: '6', description: 'Средние расходы' },
                { title: 'monsters', description: 'Цивилизация max расходов' },
                { title: 'humans', description: 'Цивилизация min расходов' },
            ]);
        });

        it('возвращает "Неизвестный параметр" для неизвестных ключей', () => {
            const highlights = {
                someKey: 100,
                someOtherKey: 1,
            } as any;

            const result = convertHighlightsToArray(highlights);
            
            expect(result[0].description).toBe('Неизвестный параметр');
            expect(result[1].description).toBe('Неизвестный параметр');
        });

        it('корректно работает с округлениями', () => {
            const highlights = {
                total_spend_galactic: 123.4,
                average_spend_galactic: 56.6,
            } as any;
            const result = convertHighlightsToArray(highlights);
            // 123.4 -> "123", 56.6 -> "57"
            
            expect(result).toContainEqual({
                title: '123',
                description: HIGHLIGHT_TITLES.total_spend_galactic,
            });
            
            expect(result).toContainEqual({
                title: '57',
                description: HIGHLIGHT_TITLES.average_spend_galactic,
            });
        });
    });
});
