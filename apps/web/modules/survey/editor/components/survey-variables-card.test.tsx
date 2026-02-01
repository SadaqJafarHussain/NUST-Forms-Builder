import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TSurveyVariable } from "@formbricks/types/surveys/types";

// Mock the child component
vi.mock("@/modules/survey/editor/components/survey-variables-card-item", () => ({
  SurveyVariablesCardItem: ({ mode, variable }: { mode: string; variable?: TSurveyVariable }) => (
    <div data-testid={`survey-variables-card-item-${mode}`}>
      {mode === "edit" && variable ? `Edit: ${variable.name}` : "Create New Variable"}
    </div>
  ),
}));

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: vi.fn(() => [vi.fn()]),
}));

const mockSetActiveQuestionId = vi.fn();

describe("SurveyVariablesCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("renders correctly with existing variables", () => {
    expect(screen.getByText("common.variables")).toBeInTheDocument();
    // Check if edit items are not rendered (collapsible is closed initially)
    expect(screen.queryByText("Edit: variable_one")).toBeNull();
    expect(screen.queryByText("Edit: variable_two")).toBeNull();
    // Check if create item is not rendered (collapsible is closed initially)
    expect(screen.queryByText("Create New Variable")).toBeNull();
  });

  test("opens and closes the collapsible content on click", async () => {
    const trigger = screen.getByText("common.variables");

    // Initially closed
    expect(screen.queryByText("Edit: variable_one")).toBeNull();
    expect(screen.queryByText("Create New Variable")).toBeNull();

    // Open
    await userEvent.click(trigger);
    expect(mockSetActiveQuestionId).toHaveBeenCalledWith(expect.stringContaining("fb-variables-"));
    // Need to re-render with the new activeQuestionId prop to simulate open state
    cleanup();

    expect(screen.getByText("Edit: variable_one")).toBeVisible();
    expect(screen.getByText("Edit: variable_two")).toBeVisible();
    expect(screen.getByText("Create New Variable")).toBeVisible();

    // Close
    await userEvent.click(screen.getByText("common.variables")); // Use the same trigger element
    expect(mockSetActiveQuestionId).toHaveBeenCalledWith(null);
    // Need to re-render with null activeQuestionId to simulate closed state
    cleanup();

    expect(screen.queryByText("Edit: variable_one")).toBeNull();
    expect(screen.queryByText("Create New Variable")).toBeNull();
  });

  test("renders placeholder text when no variables exist", async () => {
    const trigger = screen.getByText("common.variables");
    await userEvent.click(trigger);

    // Re-render with active ID
    cleanup();

    expect(screen.getByText("environments.surveys.edit.no_variables_yet_add_first_one_below")).toBeVisible();
    expect(screen.getByText("Create New Variable")).toBeVisible(); // Create section should still be visible
    expect(screen.queryByTestId("survey-variables-card-item-edit")).not.toBeInTheDocument();
  });
});
