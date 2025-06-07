
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PageTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState('');
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitle = (pageDefaultTitle: string) => {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  // Set title on mount and when default title changes
  useEffect(() => {
    if (pageDefaultTitle) {
      context.setTitle(pageDefaultTitle);
    }
    // Optional: Clear title on unmount if needed, though AppShell might keep last title
    // return () => context.setTitle(''); 
  }, [pageDefaultTitle, context.setTitle, context]);

  return context;
};

// Simpler hook if direct set is preferred over useEffect in consuming components
export const useSetPageTitle = () => {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error('useSetPageTitle must be used within a PageTitleProvider');
  }
  return context.setTitle;
}

export const useCurrentPageTitle = () => {
    const context = useContext(PageTitleContext);
    if (context === undefined) {
        throw new Error('useCurrentPageTitle must be used within a PageTitleProvider');
    }
    return context.title;
}
