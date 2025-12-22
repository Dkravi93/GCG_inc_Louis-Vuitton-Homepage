import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from './contexts/ThemeContext';
import { SimpleThemeToggle } from './components/ThemeToggle';

describe('App', () => {
  it('renders theme toggle', () => {
    render(
      <ThemeProvider>
        <SimpleThemeToggle />
      </ThemeProvider>
    );
    // Check if button exists (it has title "Switch to ...")
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
