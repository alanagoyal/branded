import { AppProps } from 'next/app';
import React from 'react';
import { CommandMenuVisibilityProvider } from '../context/CommandMenuVisibilityContext';
import { CommandMenu } from '../components/CommandMenu';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CommandMenuVisibilityProvider>
      <CommandMenu />
      <Component {...pageProps} />
    </CommandMenuVisibilityProvider>
  );
}

export default MyApp;
