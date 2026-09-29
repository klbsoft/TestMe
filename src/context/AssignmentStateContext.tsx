import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AssignmentState } from "../session/UserSession";



type Updater = Partial<AssignmentState> | ((prev: AssignmentState) => Partial<AssignmentState>);

interface Ctx {
  state: AssignmentState;
  update: (updater: Updater) => void;
}

const AssignmentStateContext = createContext<Ctx | null>(null);

export function AssignmentStateProvider({
  initial,
  children,
}: {
  initial: AssignmentState;
  children: ReactNode;
}) {
  const [state, setState] = useState<AssignmentState>(initial);

  const update = useCallback(async(updater: Updater) => {
    setState((prev) => {
      const patch = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...patch };
    });
  }, []);

  return (
    <AssignmentStateContext.Provider value={{ state, update }}>
      {children}
    </AssignmentStateContext.Provider>
  );
}

// use the object state
export function useAssignmentState(): AssignmentState {
  const ctx = useContext(AssignmentStateContext);
  if (!ctx) throw new Error("useAssignmentState must be used inside AssignmentStateProvider");
  return ctx.state;
}

// update the object state (lazy / partial)
export function useUpdateAssignment(): (updater: Updater) => void {
  const ctx = useContext(AssignmentStateContext);
  if (!ctx) throw new Error("useUpdateAssignment must be used inside AssignmentStateProvider");
  return ctx.update;
}

export function useIsDialog(): boolean {
  const { unitIndex } = useAssignmentState();
  return unitIndex === 0 || unitIndex === 6;
}