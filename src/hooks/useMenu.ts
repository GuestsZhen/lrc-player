/**
 * 菜单控制 Hook
 * 统一管理菜单的显示/隐藏和动画
 */
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMenuReturn {
    isOpen: boolean;
    isHiding: boolean;
    menuRef: React.RefObject<HTMLDivElement>;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export function useMenu(): UseMenuReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const open = useCallback(() => {
        setIsOpen(true);
        setIsHiding(false);
    }, []);

    const close = useCallback(() => {
        setIsHiding(true);
        // 等待淡出动画完成后隐藏
        setTimeout(() => {
            setIsOpen(false);
            setIsHiding(false);
        }, 300); // 与 CSS 动画时间一致
    }, []);

    const toggle = useCallback(() => {
        if (isOpen && !isHiding) {
            close();
        } else {
            open();
        }
    }, [isOpen, isHiding, close, open]);

    // 自动添加点击外部关闭
    useEffect(() => {
        if (!isOpen || isHiding) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                close();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isHiding, close]);

    return { isOpen, isHiding, menuRef, open, close, toggle };
}
