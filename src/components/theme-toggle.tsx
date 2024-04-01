import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Icons } from './icons';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      className="flex items-center space-x-2"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'dark' ? <Icons.moon className="w-5 h-5" /> : <Icons.sun className="w-5 h-5" />}
      <span className="text-sm">Toggle theme</span>
    </Button>
  );
};
