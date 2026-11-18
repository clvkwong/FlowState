import { RoutineStepsEditor } from "@/components/RoutineStepsEditor";
import { useRoutineDraftStore } from "@/stores/routineDraftStore";

/** Step management for a routine that is still being created. */
export default function NewRoutineStepsScreen() {
  const name = useRoutineDraftStore((s) => s.name);
  const steps = useRoutineDraftStore((s) => s.steps);
  const setSteps = useRoutineDraftStore((s) => s.setSteps);

  return (
    <RoutineStepsEditor
      title={name.trim() || "New routine"}
      initialSteps={steps}
      saveLabel="Done"
      onSave={setSteps}
    />
  );
}
