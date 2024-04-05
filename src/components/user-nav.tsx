import React from 'react';
import CommandShortcut from './CommandShortcut';

const UserNav: React.FC = () => {
  return (
    <nav className="user-nav">
      <div className="nav-item" aria-label="Favorites (Shortcut: Alt + F)">
        <span>Favorites</span>
        <CommandShortcut shortcut="Alt + F" />
      </div>
      <div className="nav-item" aria-label="Support (Shortcut: Alt + S)">
        <span>Support</span>
        <CommandShortcut shortcut="Alt + S" />
      </div>
      <div className="nav-item" aria-label="Switch Theme (Shortcut: Alt + T)">
        <span>Switch Theme</span>
        <CommandShortcut shortcut="Alt + T" />
      </div>
      <div className="nav-item" aria-label="Log Out (Shortcut: Alt + L)">
        <span>Log Out</span>
        <CommandShortcut shortcut="Alt + L" />
      </div>
    </nav>
  );
}

export default UserNav;
