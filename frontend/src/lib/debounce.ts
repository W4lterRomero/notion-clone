/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    const debounced = (...args: Parameters<T>) => {
        lastArgs = args;

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            if (lastArgs) {
                func(...lastArgs);
                lastArgs = null;
            }
            timeoutId = null;
        }, wait);
    };

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
    };

    debounced.flush = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            if (lastArgs) {
                func(...lastArgs);
                lastArgs = null;
            }
            timeoutId = null;
        }
    };

    return debounced;
}


