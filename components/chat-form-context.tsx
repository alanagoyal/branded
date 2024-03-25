import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useState } from 'react';

interface State {
  isCreatingCase: boolean;
  setIsCreatingCase: (isCreatingCase: boolean) => void;
}

const initialState: State = {
  isCreatingCase: false,
  setIsCreatingCase: () => {
    // Do nothing
  },
};

const ChatFormContextProvider = ({ children, ...rest }: PropsWithChildren) => {
  const [isCreatingCase, setIsCreatingCase] = useState<boolean>(false);

  return (
    <ChatFormContext.Provider
      value={{
        isCreatingCase,
        setIsCreatingCase,
      }}
      {...rest}
    >
      {children}
    </ChatFormContext.Provider>
  );
};

export const useChatForm = (): State => {
  const context = useContext(ChatFormContext);
  if (context === undefined) {
    throw new Error(
      `useChatForm must be used within a ChatFormContextProvider`,
    );
  }
  return context;
};

const ChatFormContext = createContext<State>(initialState);

ChatFormContext.displayName = 'ChatFormContext';

export const ChatFormProvider: FC<PropsWithChildren> = ({ children }) => (
  <ChatFormContextProvider>{children}</ChatFormContextProvider>
);
