import React from 'react';
import { DropdownMenuItem, DropdownMenuGroup } from './dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';

const UserNav = () => {
  return (
    <nav className="flex items-center">
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
            <button className="flex items-center w-full text-left">
              <ThemeToggle />
              <span className="ml-2">Switch theme</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </ul>
    </nav>
  );
};

export default UserNav;
