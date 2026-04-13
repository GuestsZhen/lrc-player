import React, { useEffect, useState } from 'react';

interface RouteTransitionProps {
  children: React.ReactNode;
  previousPath: string;
}

/**
 * 路由过渡动画组件
 * 提供页面切换时的淡入淡出效果
 */
export const RouteTransition: React.FC<RouteTransitionProps> = ({ 
  children, 
  previousPath 
}) => {
  const [currentPath, setCurrentPath] = useState(location.hash);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      if (previousPath !== location.hash) {
        setIsTransitioning(true);
        
        // 等待淡出动画完成后更新路径
        setTimeout(() => {
          setCurrentPath(location.hash);
          // 等待新内容渲染后开始淡入
          requestAnimationFrame(() => {
            setIsTransitioning(false);
          });
        }, 250); // 与 CSS 动画时间一致
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [previousPath]);

  return (
    <div className={`route-content${isTransitioning ? ' page-transition-out' : ' page-transition-in'}`}>
      {children}
    </div>
  );
};
