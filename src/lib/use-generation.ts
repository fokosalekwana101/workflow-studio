import { useCallback, useRef, useState } from "react";

export type GenState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T; runId: number };

/** Minimal async state machine for one-shot AI generations. */
export function useGeneration<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const [state, setState] = useState<GenState<TResult>>({ status: "idle" });
  const runs = useRef(0);
  const lastInput = useRef<TInput | null>(null);

  const run = useCallback(
    async (input: TInput) => {
      lastInput.current = input;
      const id = ++runs.current;
      setState({ status: "loading" });
      try {
        const data = await fn(input);
        if (id !== runs.current) return undefined;
        setState({ status: "success", data, runId: id });
        return data;
      } catch (e) {
        if (id === runs.current) {
          const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
          setState({ status: "error", message });
        }
        return undefined;
      }
    },
    [fn],
  );

  const regenerate = useCallback(() => {
    if (lastInput.current !== null) void run(lastInput.current);
  }, [run]);

  const reset = useCallback(() => {
    runs.current++;
    setState({ status: "idle" });
  }, []);

  const setData = useCallback((data: TResult) => {
    setState({ status: "success", data, runId: ++runs.current });
  }, []);

  return { state, run, regenerate, reset, setData };
}
