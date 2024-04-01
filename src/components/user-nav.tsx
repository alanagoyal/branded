import React from 'react';
import { DropdownMenuItem, DropdownMenuGroup } from './dropdown-menu';
import { SunMedium, Moon } from '@/components/icons.tsx';

// Assume a hook for theme detection and setting
import { useTheme } from '@/hooks/useTheme';

const UserNav = () => {
  const { theme, setTheme } = useTheme();

  // Handling the theme toggle action
  const handleThemeToggle = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <nav className="hidden lg:flex items-center">
      <ul className="flex items-center space-x-6">
        <li>
          <a href="/profile" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Profile</a>
        </li>
        <li>
          <a href="/support" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Support</a>
        </li>
        <DropdownMenuGroup title="More">
          <DropdownMenuItem link="/settings" label="Settings" />
          <DropdownMenuItem link="/logout" label="Logout" />
          <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
            <button onClick={handleThemeToggle} className="flex items-center w-full text-left">
              { theme === 'dark' ? 
                (<Moon className="mr-2 h-4 w-4" />) : 
                (<SunMedium className="mr-2 h-4 w-4" />)
              }
              <span className="ml-2">Switch theme</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </ul>
    </nav>
  );
};

export default UserNav;
