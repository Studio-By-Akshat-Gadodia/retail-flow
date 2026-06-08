import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/':           'RetailFlow — Inventory Manager',
  '/login':      'Sign In — RetailFlow',
  '/signup':     'Create Account — RetailFlow',
  '/stores':     'Select Store — RetailFlow',
  '/dashboard':  'Overview — RetailFlow',
  '/products':   'Products — RetailFlow',
  '/stock':      'Inventory — RetailFlow',
  '/suppliers':  'Suppliers — RetailFlow',
  '/sales':      'Sales — RetailFlow',
  '/alerts':     'Alerts — RetailFlow',
  '/reports':    'Reports — RetailFlow',
  '/scanner':    'Scanner — RetailFlow',
  '/settings':   'Settings — RetailFlow',
};

export function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'RetailFlow';
  }, [pathname]);
}
