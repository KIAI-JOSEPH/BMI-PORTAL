/**
 * Login — smoke tests
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Login from "./Login";

describe("Login", () => {
  const mockOnLogin = vi.fn();

  it("renders the login form with an email input", () => {
    render(<Login onLogin={mockOnLogin} />);
    // The email input has placeholder 'name@university.edu'
    const emailInput = screen.getByPlaceholderText(/university\.edu/i);
    expect(emailInput).toBeInTheDocument();
  });

  it("renders a submit / sign-in button", () => {
    render(<Login onLogin={mockOnLogin} />);
    const btn = screen.getByRole("button", { name: /sign in|login|access/i });
    expect(btn).toBeInTheDocument();
  });

  it("does not call onLogin before submission", () => {
    render(<Login onLogin={mockOnLogin} />);
    expect(mockOnLogin).not.toHaveBeenCalled();
  });
});
