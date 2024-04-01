import React from 'react';
import * as Icons from './icons';

const ThemeToggle = () => {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <button onClick={toggleTheme} aria-label="Toggle Theme" className="focus:outline-none">
      <div className="relative h-6 w-6">
        <Icons.sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Icons.moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
    </button>
  );
};

export default ThemeToggle;
