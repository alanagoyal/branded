import React from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu-item';
import { ThemeToggle } from './theme-toggle';

const UserNav = () => {
  return (
    <>
      <div className="block lg:hidden"> {/* Ensures mobile-only visibility */}
        <DropdownMenuItem className="flex items-center justify-between w-full py-2">
          <ThemeToggle />
          <span className="ml-2 text-sm text-foreground">Toggle Theme</span>
        </DropdownMenuItem>
      </div>
    </>
  );
};

export default UserNav;
