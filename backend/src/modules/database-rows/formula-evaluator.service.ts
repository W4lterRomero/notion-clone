import { Injectable } from '@nestjs/common';

/**
 * Formula Evaluator Service
 * 
 * Safe expression evaluator for formula properties.
 * Supports: Math, Text, Logic, Date functions and property references.
 * Does NOT use eval() - implements a custom tokenizer/parser.
 */

// Token types for the lexer
type TokenType =
    | 'NUMBER'
    | 'STRING'
    | 'IDENTIFIER'
    | 'OPERATOR'
    | 'LPAREN'
    | 'RPAREN'
    | 'COMMA'
    | 'EOF';

interface Token {
    type: TokenType;
    value: string | number;
}

// AST node types
type ASTNode =
    | { type: 'Number'; value: number }
    | { type: 'String'; value: string }
    | { type: 'Boolean'; value: boolean }
    | { type: 'FunctionCall'; name: string; args: ASTNode[] }
    | { type: 'BinaryOp'; operator: string; left: ASTNode; right: ASTNode }
    | { type: 'UnaryOp'; operator: string; operand: ASTNode };

export interface FormulaContext {
    properties: Map<string, { name: string; type: string; value: unknown }>;
    rowId: string;
}

export interface FormulaResult {
    value: unknown;
    error?: string;
    type: 'number' | 'string' | 'boolean' | 'date' | 'null' | 'error';
}

@Injectable()
export class FormulaEvaluatorService {
    /**
     * Evaluate a formula expression
     */
    evaluate(expression: string, context: FormulaContext): FormulaResult {
        try {
            if (!expression || expression.trim() === '') {
                return { value: null, type: 'null' };
            }

            const tokens = this.tokenize(expression);
            const ast = this.parse(tokens);
            const result = this.evaluateNode(ast, context);

            return this.formatResult(result);
        } catch (error) {
            return {
                value: null,
                error: error instanceof Error ? error.message : 'Invalid formula',
                type: 'error',
            };
        }
    }

    /**
     * Validate a formula expression
     */
    validate(expression: string, availableProperties: string[]): { valid: boolean; error?: string } {
        try {
            const tokens = this.tokenize(expression);
            this.parse(tokens);

            // Check if all prop() references exist
            const propReferences = this.extractPropertyReferences(expression);
            const missing = propReferences.filter(p => !availableProperties.includes(p));

            if (missing.length > 0) {
                return { valid: false, error: `Unknown properties: ${missing.join(', ')}` };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error instanceof Error ? error.message : 'Invalid formula' };
        }
    }

    private extractPropertyReferences(expression: string): string[] {
        const matches = expression.matchAll(/prop\s*\(\s*["']([^"']+)["']\s*\)/g);
        return [...matches].map(m => m[1]);
    }

    // ============================================
    // TOKENIZER (Lexer)
    // ============================================

    private tokenize(expression: string): Token[] {
        const tokens: Token[] = [];
        let pos = 0;
        const length = expression.length;

        while (pos < length) {
            const char = expression[pos];

            // Skip whitespace
            if (/\s/.test(char)) {
                pos++;
                continue;
            }

            // Numbers (including decimals)
            if (/\d/.test(char)) {
                let num = '';
                while (pos < length && /[\d.]/.test(expression[pos])) {
                    num += expression[pos++];
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(num) });
                continue;
            }

            // Strings
            if (char === '"' || char === "'") {
                const quote = char;
                pos++;
                let str = '';
                while (pos < length && expression[pos] !== quote) {
                    str += expression[pos++];
                }
                pos++; // Skip closing quote
                tokens.push({ type: 'STRING', value: str });
                continue;
            }

            // Identifiers (function names, true, false)
            if (/[a-zA-Z_]/.test(char)) {
                let id = '';
                while (pos < length && /[a-zA-Z0-9_]/.test(expression[pos])) {
                    id += expression[pos++];
                }
                tokens.push({ type: 'IDENTIFIER', value: id });
                continue;
            }

            // Operators
            if (/[+\-*/%<>=!&|]/.test(char)) {
                let op = char;
                pos++;
                // Check for two-char operators
                if (pos < length && /[=&|]/.test(expression[pos])) {
                    op += expression[pos++];
                }
                tokens.push({ type: 'OPERATOR', value: op });
                continue;
            }

            // Parentheses
            if (char === '(') {
                tokens.push({ type: 'LPAREN', value: '(' });
                pos++;
                continue;
            }
            if (char === ')') {
                tokens.push({ type: 'RPAREN', value: ')' });
                pos++;
                continue;
            }

            // Comma
            if (char === ',') {
                tokens.push({ type: 'COMMA', value: ',' });
                pos++;
                continue;
            }

            throw new Error(`Unexpected character: ${char}`);
        }

        tokens.push({ type: 'EOF', value: '' });
        return tokens;
    }

    // ============================================
    // PARSER
    // ============================================

    private parse(tokens: Token[]): ASTNode {
        let pos = 0;

        const peek = (): Token => tokens[pos];
        const consume = (): Token => tokens[pos++];

        const parseExpression = (): ASTNode => parseComparison();

        const parseComparison = (): ASTNode => {
            let left = parseAdditive();

            while (peek().type === 'OPERATOR' && ['==', '!=', '<', '>', '<=', '>='].includes(peek().value as string)) {
                const op = consume().value as string;
                const right = parseAdditive();
                left = { type: 'BinaryOp', operator: op, left, right };
            }

            return left;
        };

        const parseAdditive = (): ASTNode => {
            let left = parseMultiplicative();

            while (peek().type === 'OPERATOR' && ['+', '-'].includes(peek().value as string)) {
                const op = consume().value as string;
                const right = parseMultiplicative();
                left = { type: 'BinaryOp', operator: op, left, right };
            }

            return left;
        };

        const parseMultiplicative = (): ASTNode => {
            let left = parseUnary();

            while (peek().type === 'OPERATOR' && ['*', '/', '%'].includes(peek().value as string)) {
                const op = consume().value as string;
                const right = parseUnary();
                left = { type: 'BinaryOp', operator: op, left, right };
            }

            return left;
        };

        const parseUnary = (): ASTNode => {
            if (peek().type === 'OPERATOR' && ['-', '!'].includes(peek().value as string)) {
                const op = consume().value as string;
                const operand = parseUnary();
                return { type: 'UnaryOp', operator: op, operand };
            }
            return parsePrimary();
        };

        const parsePrimary = (): ASTNode => {
            const token = peek();

            if (token.type === 'NUMBER') {
                consume();
                return { type: 'Number', value: token.value as number };
            }

            if (token.type === 'STRING') {
                consume();
                return { type: 'String', value: token.value as string };
            }

            if (token.type === 'IDENTIFIER') {
                const name = consume().value as string;

                // Handle boolean literals
                if (name === 'true') return { type: 'Boolean', value: true };
                if (name === 'false') return { type: 'Boolean', value: false };

                // Handle function calls
                if (peek().type === 'LPAREN') {
                    consume(); // (
                    const args: ASTNode[] = [];

                    if (peek().type !== 'RPAREN') {
                        args.push(parseExpression());
                        while (peek().type === 'COMMA') {
                            consume(); // ,
                            args.push(parseExpression());
                        }
                    }

                    if (peek().type !== 'RPAREN') {
                        throw new Error(`Expected ')' but got ${peek().value}`);
                    }
                    consume(); // )

                    return { type: 'FunctionCall', name, args };
                }

                throw new Error(`Unknown identifier: ${name}`);
            }

            if (token.type === 'LPAREN') {
                consume(); // (
                const expr = parseExpression();
                if (peek().type !== 'RPAREN') {
                    throw new Error(`Expected ')' but got ${peek().value}`);
                }
                consume(); // )
                return expr;
            }

            throw new Error(`Unexpected token: ${token.value}`);
        };

        const result = parseExpression();
        if (peek().type !== 'EOF') {
            throw new Error(`Unexpected token: ${peek().value}`);
        }
        return result;
    }

    // ============================================
    // EVALUATOR
    // ============================================

    private evaluateNode(node: ASTNode, context: FormulaContext): unknown {
        switch (node.type) {
            case 'Number':
                return node.value;

            case 'String':
                return node.value;

            case 'Boolean':
                return node.value;

            case 'BinaryOp':
                return this.evaluateBinaryOp(node, context);

            case 'UnaryOp':
                return this.evaluateUnaryOp(node, context);

            case 'FunctionCall':
                return this.evaluateFunction(node.name, node.args, context);

            default:
                throw new Error('Unknown node type');
        }
    }

    private evaluateBinaryOp(node: { type: 'BinaryOp'; operator: string; left: ASTNode; right: ASTNode }, context: FormulaContext): unknown {
        const left = this.evaluateNode(node.left, context);
        const right = this.evaluateNode(node.right, context);

        switch (node.operator) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left ?? '') + String(right ?? '');
                }
                return (left as number) + (right as number);
            case '-':
                return (left as number) - (right as number);
            case '*':
                return (left as number) * (right as number);
            case '/':
                if (right === 0) throw new Error('Division by zero');
                return (left as number) / (right as number);
            case '%':
                return (left as number) % (right as number);
            case '==':
                return left === right;
            case '!=':
                return left !== right;
            case '<':
                return (left as number) < (right as number);
            case '>':
                return (left as number) > (right as number);
            case '<=':
                return (left as number) <= (right as number);
            case '>=':
                return (left as number) >= (right as number);
            case '&&':
                return Boolean(left) && Boolean(right);
            case '||':
                return Boolean(left) || Boolean(right);
            default:
                throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    private evaluateUnaryOp(node: { type: 'UnaryOp'; operator: string; operand: ASTNode }, context: FormulaContext): unknown {
        const operand = this.evaluateNode(node.operand, context);

        switch (node.operator) {
            case '-':
                return -(operand as number);
            case '!':
                return !operand;
            default:
                throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }

    // ============================================
    // BUILT-IN FUNCTIONS (40+)
    // ============================================

    private evaluateFunction(name: string, args: ASTNode[], context: FormulaContext): unknown {
        const evalArgs = () => args.map(a => this.evaluateNode(a, context));

        switch (name.toLowerCase()) {
            // === PROPERTY REFERENCE ===
            case 'prop':
                return this.fnProp(args, context);

            // === MATH FUNCTIONS ===
            case 'abs':
                return Math.abs(evalArgs()[0] as number);
            case 'round':
                return Math.round(evalArgs()[0] as number);
            case 'floor':
                return Math.floor(evalArgs()[0] as number);
            case 'ceil':
                return Math.ceil(evalArgs()[0] as number);
            case 'sqrt':
                return Math.sqrt(evalArgs()[0] as number);
            case 'pow': {
                const [base, exp] = evalArgs() as number[];
                return Math.pow(base, exp);
            }
            case 'min':
                return Math.min(...(evalArgs() as number[]));
            case 'max':
                return Math.max(...(evalArgs() as number[]));
            case 'sum':
                return (evalArgs() as number[]).reduce((a, b) => a + b, 0);
            case 'average': {
                const nums = evalArgs() as number[];
                return nums.reduce((a, b) => a + b, 0) / nums.length;
            }

            // === TEXT FUNCTIONS ===
            case 'concat':
                return evalArgs().map(v => String(v ?? '')).join('');
            case 'join': {
                const vals = evalArgs();
                const sep = vals.length > 1 ? String(vals[vals.length - 1]) : ',';
                return vals.slice(0, -1).map(v => String(v ?? '')).join(sep);
            }
            case 'length':
                return String(evalArgs()[0] ?? '').length;
            case 'upper':
                return String(evalArgs()[0] ?? '').toUpperCase();
            case 'lower':
                return String(evalArgs()[0] ?? '').toLowerCase();
            case 'trim':
                return String(evalArgs()[0] ?? '').trim();
            case 'replace': {
                const [str, search, replacement] = evalArgs() as string[];
                return String(str).replace(new RegExp(search, 'g'), replacement);
            }
            case 'slice': {
                const [str, start, end] = evalArgs() as [string, number, number?];
                return String(str).slice(start, end);
            }
            case 'contains': {
                const [str, search] = evalArgs() as string[];
                return String(str).includes(search);
            }
            case 'test': {
                const [str, regex] = evalArgs() as string[];
                return new RegExp(regex).test(str);
            }

            // === LOGIC FUNCTIONS ===
            case 'if': {
                const condition = this.evaluateNode(args[0], context);
                return condition
                    ? this.evaluateNode(args[1], context)
                    : args[2] ? this.evaluateNode(args[2], context) : null;
            }
            case 'and':
                return evalArgs().every(Boolean);
            case 'or':
                return evalArgs().some(Boolean);
            case 'not':
                return !evalArgs()[0];
            case 'equal': {
                const [a, b] = evalArgs();
                return a === b;
            }
            case 'unequal': {
                const [a, b] = evalArgs();
                return a !== b;
            }
            case 'greater': {
                const [a, b] = evalArgs() as number[];
                return a > b;
            }
            case 'less': {
                const [a, b] = evalArgs() as number[];
                return a < b;
            }
            case 'empty':
                return evalArgs()[0] === null || evalArgs()[0] === undefined || evalArgs()[0] === '';

            // === DATE FUNCTIONS ===
            case 'now':
                return new Date().toISOString();
            case 'today':
                return new Date().toISOString().split('T')[0];
            case 'year':
                return new Date(evalArgs()[0] as string).getFullYear();
            case 'month':
                return new Date(evalArgs()[0] as string).getMonth() + 1;
            case 'day':
                return new Date(evalArgs()[0] as string).getDate();
            case 'datediff': {
                const [date1, date2, unit] = evalArgs() as [string, string, string];
                const d1 = new Date(date1).getTime();
                const d2 = new Date(date2).getTime();
                const diff = Math.abs(d2 - d1);
                switch (unit) {
                    case 'days':
                        return Math.floor(diff / (1000 * 60 * 60 * 24));
                    case 'hours':
                        return Math.floor(diff / (1000 * 60 * 60));
                    case 'minutes':
                        return Math.floor(diff / (1000 * 60));
                    default:
                        return diff;
                }
            }
            case 'dateadd': {
                const [date, amount, unit] = evalArgs() as [string, number, string];
                const d = new Date(date);
                switch (unit) {
                    case 'days':
                        d.setDate(d.getDate() + amount);
                        break;
                    case 'months':
                        d.setMonth(d.getMonth() + amount);
                        break;
                    case 'years':
                        d.setFullYear(d.getFullYear() + amount);
                        break;
                }
                return d.toISOString();
            }

            // === LIST FUNCTIONS ===
            case 'first': {
                const arr = evalArgs()[0];
                return Array.isArray(arr) ? arr[0] : null;
            }
            case 'last': {
                const arr = evalArgs()[0];
                return Array.isArray(arr) ? arr[arr.length - 1] : null;
            }
            case 'at': {
                const [arr, idx] = evalArgs() as [unknown[], number];
                return Array.isArray(arr) ? arr[idx] : null;
            }
            case 'unique': {
                const arr = evalArgs()[0];
                return Array.isArray(arr) ? [...new Set(arr)] : [];
            }

            default:
                throw new Error(`Unknown function: ${name}`);
        }
    }

    private fnProp(args: ASTNode[], context: FormulaContext): unknown {
        if (args.length !== 1 || args[0].type !== 'String') {
            throw new Error('prop() requires a single string argument');
        }

        const propName = args[0].value;

        for (const prop of context.properties.values()) {
            if (prop.name === propName) {
                return prop.value;
            }
        }

        throw new Error(`Property not found: ${propName}`);
    }

    // ============================================
    // RESULT FORMATTING
    // ============================================

    private formatResult(value: unknown): FormulaResult {
        if (value === null || value === undefined) {
            return { value: null, type: 'null' };
        }

        if (typeof value === 'number') {
            return { value, type: 'number' };
        }

        if (typeof value === 'boolean') {
            return { value, type: 'boolean' };
        }

        if (typeof value === 'string') {
            // Check if it's a date
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                return { value, type: 'date' };
            }
            return { value, type: 'string' };
        }

        return { value: String(value), type: 'string' };
    }
}
