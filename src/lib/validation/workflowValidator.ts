export function validateWorkflow(json: any) {
  const errors: string[] = [];

  if (!json) {
    errors.push("Workflow object is null or undefined");
    return { valid: false, errors };
  }

  if (!json.workflow_name) errors.push("Missing workflow_name");
  if (!json.nodes || !Array.isArray(json.nodes)) errors.push("Missing nodes");
  if (!json.edges || !Array.isArray(json.edges)) errors.push("Missing edges");
  if (!json.execution_plan) errors.push("Missing execution_plan");

  if (json.nodes?.length < 8) {
    errors.push("Too few nodes");
  }

  const hasHR = json.nodes?.some(
    (n: any) => n.data?.department === "hr"
  );

  if (!hasHR) errors.push("Missing HR department");

  return {
    valid: errors.length === 0,
    errors,
  };
}