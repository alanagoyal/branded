import React, { createContext, useState, ReactNode } from 'react';

interface AppContextInterface {
  isUserNavVisible: boolean;
  toggleUserNavVisibility: () => void;
}

const defaultState = {
  isUserNavVisible: false,
  toggleUserNavVisibility: () => {},
};

export const AppContext = createContext<AppContextInterface>(defaultState);

export const AppContextProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isUserNavVisible, setIsUserNavVisible] = useState(false);

  const toggleUserNavVisibility = () => {
    setIsUserNavVisible(prevState => !prevState);
  };

  return (
    <AppContext.Provider value={{ isUserNavVisible, toggleUserNavVisibility }}>
      {children}
    </AppContext.Provider>
  );
};
