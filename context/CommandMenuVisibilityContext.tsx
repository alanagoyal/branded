import React, { createContext, useContext, useState, FC, PropsWithChildren } from 'react';

interface CommandMenuVisibilityState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const initialState: CommandMenuVisibilityState = {
  isOpen: false,
  setIsOpen: () => {},
};

const CommandMenuVisibilityContext = createContext<CommandMenuVisibilityState>(initialState);
CommandMenuVisibilityContext.displayName = 'CommandMenuVisibilityContext';

export const useCommandMenuVisibility = (): CommandMenuVisibilityState => {
  const context = useContext(CommandMenuVisibilityContext);
  if (context === undefined) {
    throw new Error(`useCommandMenuVisibility must be used within a CommandMenuVisibilityProvider`);
  }
  return context;
};

export const CommandMenuVisibilityProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <CommandMenuVisibilityContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </CommandMenuVisibilityContext.Provider>
  );
};
