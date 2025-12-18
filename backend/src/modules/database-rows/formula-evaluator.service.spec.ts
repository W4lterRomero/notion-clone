import { FormulaEvaluatorService, FormulaContext } from './formula-evaluator.service';

describe('FormulaEvaluatorService', () => {
    let service: FormulaEvaluatorService;

    beforeEach(() => {
        service = new FormulaEvaluatorService();
    });

    // Helper to create a context with properties
    const createContext = (props: Record<string, { name: string; type: string; value: unknown }>): FormulaContext => ({
        rowId: 'test-row-id',
        properties: new Map(Object.entries(props).map(([id, prop]) => [id, prop])),
    });

    // ============================================
    // BASIC EXPRESSIONS
    // ============================================
    describe('Basic Expressions', () => {
        it('should evaluate numbers', () => {
            const result = service.evaluate('42', createContext({}));
            expect(result.value).toBe(42);
            expect(result.type).toBe('number');
        });

        it('should evaluate decimal numbers', () => {
            const result = service.evaluate('3.14', createContext({}));
            expect(result.value).toBe(3.14);
            expect(result.type).toBe('number');
        });

        it('should evaluate strings', () => {
            const result = service.evaluate('"hello"', createContext({}));
            expect(result.value).toBe('hello');
            expect(result.type).toBe('string');
        });

        it('should evaluate single-quoted strings', () => {
            const result = service.evaluate("'world'", createContext({}));
            expect(result.value).toBe('world');
            expect(result.type).toBe('string');
        });

        it('should evaluate boolean true', () => {
            const result = service.evaluate('true', createContext({}));
            expect(result.value).toBe(true);
            expect(result.type).toBe('boolean');
        });

        it('should evaluate boolean false', () => {
            const result = service.evaluate('false', createContext({}));
            expect(result.value).toBe(false);
            expect(result.type).toBe('boolean');
        });

        it('should return null for empty expression', () => {
            const result = service.evaluate('', createContext({}));
            expect(result.value).toBe(null);
            expect(result.type).toBe('null');
        });
    });

    // ============================================
    // MATH OPERATIONS
    // ============================================
    describe('Math Operations', () => {
        it('should add numbers', () => {
            const result = service.evaluate('5 + 3', createContext({}));
            expect(result.value).toBe(8);
        });

        it('should subtract numbers', () => {
            const result = service.evaluate('10 - 4', createContext({}));
            expect(result.value).toBe(6);
        });

        it('should multiply numbers', () => {
            const result = service.evaluate('6 * 7', createContext({}));
            expect(result.value).toBe(42);
        });

        it('should divide numbers', () => {
            const result = service.evaluate('20 / 4', createContext({}));
            expect(result.value).toBe(5);
        });

        it('should handle modulo', () => {
            const result = service.evaluate('17 % 5', createContext({}));
            expect(result.value).toBe(2);
        });

        it('should respect operator precedence', () => {
            const result = service.evaluate('2 + 3 * 4', createContext({}));
            expect(result.value).toBe(14); // Not 20
        });

        it('should handle parentheses', () => {
            const result = service.evaluate('(2 + 3) * 4', createContext({}));
            expect(result.value).toBe(20);
        });

        it('should handle unary minus', () => {
            const result = service.evaluate('-5', createContext({}));
            expect(result.value).toBe(-5);
        });

        it('should throw on division by zero', () => {
            const result = service.evaluate('10 / 0', createContext({}));
            expect(result.type).toBe('error');
            expect(result.error).toContain('Division by zero');
        });
    });

    // ============================================
    // MATH FUNCTIONS
    // ============================================
    describe('Math Functions', () => {
        it('should calculate abs()', () => {
            expect(service.evaluate('abs(-5)', createContext({})).value).toBe(5);
            expect(service.evaluate('abs(5)', createContext({})).value).toBe(5);
        });

        it('should calculate round()', () => {
            expect(service.evaluate('round(3.7)', createContext({})).value).toBe(4);
            expect(service.evaluate('round(3.2)', createContext({})).value).toBe(3);
        });

        it('should calculate floor()', () => {
            expect(service.evaluate('floor(3.9)', createContext({})).value).toBe(3);
        });

        it('should calculate ceil()', () => {
            expect(service.evaluate('ceil(3.1)', createContext({})).value).toBe(4);
        });

        it('should calculate sqrt()', () => {
            expect(service.evaluate('sqrt(16)', createContext({})).value).toBe(4);
        });

        it('should calculate pow()', () => {
            expect(service.evaluate('pow(2, 3)', createContext({})).value).toBe(8);
        });

        it('should calculate min()', () => {
            expect(service.evaluate('min(5, 3, 8, 1)', createContext({})).value).toBe(1);
        });

        it('should calculate max()', () => {
            expect(service.evaluate('max(5, 3, 8, 1)', createContext({})).value).toBe(8);
        });

        it('should calculate sum()', () => {
            expect(service.evaluate('sum(1, 2, 3, 4)', createContext({})).value).toBe(10);
        });

        it('should calculate average()', () => {
            expect(service.evaluate('average(2, 4, 6)', createContext({})).value).toBe(4);
        });
    });

    // ============================================
    // TEXT FUNCTIONS
    // ============================================
    describe('Text Functions', () => {
        it('should concat strings', () => {
            const result = service.evaluate('concat("Hello", " ", "World")', createContext({}));
            expect(result.value).toBe('Hello World');
        });

        it('should calculate length()', () => {
            expect(service.evaluate('length("hello")', createContext({})).value).toBe(5);
        });

        it('should convert to upper()', () => {
            expect(service.evaluate('upper("hello")', createContext({})).value).toBe('HELLO');
        });

        it('should convert to lower()', () => {
            expect(service.evaluate('lower("HELLO")', createContext({})).value).toBe('hello');
        });

        it('should trim()', () => {
            expect(service.evaluate('trim("  hello  ")', createContext({})).value).toBe('hello');
        });

        it('should check contains()', () => {
            expect(service.evaluate('contains("hello world", "world")', createContext({})).value).toBe(true);
            expect(service.evaluate('contains("hello world", "foo")', createContext({})).value).toBe(false);
        });

        it('should handle string concatenation with +', () => {
            const result = service.evaluate('"Hello" + " " + "World"', createContext({}));
            expect(result.value).toBe('Hello World');
        });
    });

    // ============================================
    // LOGIC FUNCTIONS
    // ============================================
    describe('Logic Functions', () => {
        it('should evaluate if() with true condition', () => {
            const result = service.evaluate('if(true, "yes", "no")', createContext({}));
            expect(result.value).toBe('yes');
        });

        it('should evaluate if() with false condition', () => {
            const result = service.evaluate('if(false, "yes", "no")', createContext({}));
            expect(result.value).toBe('no');
        });

        it('should evaluate if() with comparison', () => {
            const result = service.evaluate('if(5 > 3, "bigger", "smaller")', createContext({}));
            expect(result.value).toBe('bigger');
        });

        it('should evaluate and()', () => {
            expect(service.evaluate('and(true, true)', createContext({})).value).toBe(true);
            expect(service.evaluate('and(true, false)', createContext({})).value).toBe(false);
        });

        it('should evaluate or()', () => {
            expect(service.evaluate('or(true, false)', createContext({})).value).toBe(true);
            expect(service.evaluate('or(false, false)', createContext({})).value).toBe(false);
        });

        it('should evaluate not()', () => {
            expect(service.evaluate('not(true)', createContext({})).value).toBe(false);
            expect(service.evaluate('not(false)', createContext({})).value).toBe(true);
        });

        it('should evaluate equal()', () => {
            expect(service.evaluate('equal(5, 5)', createContext({})).value).toBe(true);
            expect(service.evaluate('equal(5, 6)', createContext({})).value).toBe(false);
        });

        it('should evaluate empty()', () => {
            expect(service.evaluate('empty("")', createContext({})).value).toBe(true);
            expect(service.evaluate('empty("hello")', createContext({})).value).toBe(false);
        });
    });

    // ============================================
    // COMPARISON OPERATORS
    // ============================================
    describe('Comparison Operators', () => {
        it('should evaluate ==', () => {
            expect(service.evaluate('5 == 5', createContext({})).value).toBe(true);
            expect(service.evaluate('5 == 6', createContext({})).value).toBe(false);
        });

        it('should evaluate !=', () => {
            expect(service.evaluate('5 != 6', createContext({})).value).toBe(true);
            expect(service.evaluate('5 != 5', createContext({})).value).toBe(false);
        });

        it('should evaluate <', () => {
            expect(service.evaluate('3 < 5', createContext({})).value).toBe(true);
            expect(service.evaluate('5 < 3', createContext({})).value).toBe(false);
        });

        it('should evaluate >', () => {
            expect(service.evaluate('5 > 3', createContext({})).value).toBe(true);
            expect(service.evaluate('3 > 5', createContext({})).value).toBe(false);
        });

        it('should evaluate <=', () => {
            expect(service.evaluate('3 <= 5', createContext({})).value).toBe(true);
            expect(service.evaluate('5 <= 5', createContext({})).value).toBe(true);
        });

        it('should evaluate >=', () => {
            expect(service.evaluate('5 >= 3', createContext({})).value).toBe(true);
            expect(service.evaluate('5 >= 5', createContext({})).value).toBe(true);
        });
    });

    // ============================================
    // DATE FUNCTIONS
    // ============================================
    describe('Date Functions', () => {
        it('should return now()', () => {
            const result = service.evaluate('now()', createContext({}));
            expect(result.type).toBe('date');
            expect(typeof result.value).toBe('string');
        });

        it('should return today()', () => {
            const result = service.evaluate('today()', createContext({}));
            expect(typeof result.value).toBe('string');
            expect((result.value as string).length).toBe(10); // YYYY-MM-DD
        });

        it('should extract year()', () => {
            const result = service.evaluate('year("2024-06-15")', createContext({}));
            expect(result.value).toBe(2024);
        });

        it('should extract month()', () => {
            const result = service.evaluate('month("2024-06-15")', createContext({}));
            expect(result.value).toBe(6);
        });

        it('should extract day()', () => {
            const result = service.evaluate('day("2024-06-15")', createContext({}));
            expect(result.value).toBe(15);
        });
    });

    // ============================================
    // PROPERTY REFERENCES
    // ============================================
    describe('Property References', () => {
        it('should get property value with prop()', () => {
            const context = createContext({
                'prop-1': { name: 'Price', type: 'number', value: 100 },
            });
            const result = service.evaluate('prop("Price")', context);
            expect(result.value).toBe(100);
        });

        it('should use property values in calculations', () => {
            const context = createContext({
                'prop-1': { name: 'Price', type: 'number', value: 50 },
                'prop-2': { name: 'Quantity', type: 'number', value: 3 },
            });
            const result = service.evaluate('prop("Price") * prop("Quantity")', context);
            expect(result.value).toBe(150);
        });

        it('should handle text property values', () => {
            const context = createContext({
                'prop-1': { name: 'FirstName', type: 'text', value: 'John' },
                'prop-2': { name: 'LastName', type: 'text', value: 'Doe' },
            });
            const result = service.evaluate('concat(prop("FirstName"), " ", prop("LastName"))', context);
            expect(result.value).toBe('John Doe');
        });

        it('should throw error for non-existent property', () => {
            const context = createContext({});
            const result = service.evaluate('prop("NonExistent")', context);
            expect(result.type).toBe('error');
            expect(result.error).toContain('Property not found');
        });
    });

    // ============================================
    // ERROR HANDLING
    // ============================================
    describe('Error Handling', () => {
        it('should handle syntax errors gracefully', () => {
            const result = service.evaluate('5 +', createContext({}));
            expect(result.type).toBe('error');
        });

        it('should handle unknown functions', () => {
            const result = service.evaluate('unknownFunc(5)', createContext({}));
            expect(result.type).toBe('error');
            expect(result.error).toContain('Unknown function');
        });

        it('should handle unbalanced parentheses', () => {
            const result = service.evaluate('(5 + 3', createContext({}));
            expect(result.type).toBe('error');
        });

        it('should handle unexpected characters', () => {
            const result = service.evaluate('5 @ 3', createContext({}));
            expect(result.type).toBe('error');
        });
    });

    // ============================================
    // COMPLEX FORMULAS
    // ============================================
    describe('Complex Formulas', () => {
        it('should handle nested function calls', () => {
            const result = service.evaluate('round(sqrt(pow(3, 2) + pow(4, 2)))', createContext({}));
            expect(result.value).toBe(5); // 3-4-5 triangle
        });

        it('should handle conditional with calculations', () => {
            const context = createContext({
                'prop-1': { name: 'Score', type: 'number', value: 85 },
            });
            const result = service.evaluate('if(prop("Score") >= 90, "A", if(prop("Score") >= 80, "B", "C"))', context);
            expect(result.value).toBe('B');
        });

        it('should handle mixed types in formula', () => {
            const context = createContext({
                'prop-1': { name: 'Amount', type: 'number', value: 1500 },
            });
            const result = service.evaluate('if(prop("Amount") > 1000, concat("$", prop("Amount")), "Low")', context);
            expect(result.value).toBe('$1500');
        });
    });

    // ============================================
    // VALIDATION
    // ============================================
    describe('Validation', () => {
        it('should validate correct formula', () => {
            const result = service.validate('5 + 3', []);
            expect(result.valid).toBe(true);
        });

        it('should detect missing properties', () => {
            const result = service.validate('prop("Price") * 2', ['Quantity']);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unknown properties');
        });

        it('should accept existing properties', () => {
            const result = service.validate('prop("Price") * 2', ['Price', 'Quantity']);
            expect(result.valid).toBe(true);
        });

        it('should detect syntax errors', () => {
            const result = service.validate('5 +', []);
            expect(result.valid).toBe(false);
        });
    });
});
