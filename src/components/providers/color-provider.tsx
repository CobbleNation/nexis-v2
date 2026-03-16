'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeColor = 'orange' | 'purple' | 'blue' | 'emerald';

interface ColorContextType {
    themeColor: ThemeColor;
    setThemeColor: (color: ThemeColor) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
    const [themeColor, setThemeColor] = useState<ThemeColor>('orange');

    // Run once on mount to get the saved color from localStorage
    useEffect(() => {
        const savedColor = localStorage.getItem('zynorvia-theme-color') as ThemeColor;
        if (savedColor && ['orange', 'purple', 'blue', 'emerald'].includes(savedColor)) {
            setThemeColor(savedColor);
        }
    }, []);

    // Apply the color scheme via vanilla JS manipulating the root element's attribute
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old theme colors
        root.removeAttribute('data-theme-color');
        
        // Add new theme color if not default
        if (themeColor !== 'orange') {
            root.setAttribute('data-theme-color', themeColor);
        }
        
        // Keep localized storage up to date
        localStorage.setItem('zynorvia-theme-color', themeColor);
    }, [themeColor]);

    return (
        <ColorContext.Provider value={{ themeColor, setThemeColor }}>
            {children}
        </ColorContext.Provider>
    );
}

export function useColorTheme() {
    const context = useContext(ColorContext);
    if (context === undefined) {
        throw new Error('useColorTheme must be used within a ColorProvider');
    }
    return context;
}
