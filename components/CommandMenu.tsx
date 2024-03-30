import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCommandMenuVisibility } from '../context/CommandMenuVisibilityContext';

export function CommandMenu() {
  const { isOpen, setIsOpen } = useCommandMenuVisibility();

  useEffect(() => {
    const toggleMenuVisibility = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    
    document.addEventListener("keydown", toggleMenuVisibility);
    return () => document.removeEventListener("keydown", toggleMenuVisibility);
  }, [isOpen, setIsOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-12 p-4 shadow-lg rounded-lg bg-white dark:bg-gray-800">
      <Link href="/profile">
        <a className="block py-2">Profile</a>
      </Link>
      <Link href="/help">
        <a className="block py-2">Support</a>
      </Link>
    </div>);
}
