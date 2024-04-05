import React from 'react';

interface CommandShortcutProps {
  shortcut: string;
  description?: string;
}

const CommandShortcut: React.FC<CommandShortcutProps> = ({shortcut, description}) => {
  return (
    <span className="shortcut-display">{shortcut}</span>
  );
}

export default CommandShortcut;
