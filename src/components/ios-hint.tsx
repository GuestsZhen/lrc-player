import { useState, useEffect } from 'react';
import './ios-hint.css';

interface IOSHintProps {
    show: boolean;
    onClose: () => void;
}

export const IOSHint: React.FC<IOSHintProps> = ({ show, onClose }) => {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
    }, [show]);

    if (!visible) return null;

    return (
        <div className="ios-hint-overlay" onClick={onClose}>
            <div className="ios-hint-card" onClick={(e) => e.stopPropagation()}>
                <button className="ios-hint-close" onClick={onClose}>
                    ✕
                </button>
                
                <div className="ios-hint-icon">📱</div>
                
                <h3 className="ios-hint-title">iOS 全屏提示</h3>
                
                <p className="ios-hint-description">
                    iOS Safari/Chrome 浏览器不支持网页全屏功能。
                </p>
                
                <div className="ios-hint-steps">
                    <h4>获得最佳体验的方法：</h4>
                    <ol>
                        <li>
                            <span className="step-icon">📤</span>
                            点击浏览器底部的<strong>分享按钮</strong>
                        </li>
                        <li>
                            <span className="step-icon">➕</span>
                            向下滚动，选择<strong>"添加到主屏幕"</strong>
                        </li>
                        <li>
                            <span className="step-icon">✅</span>
                            点击<strong>"添加"</strong>确认
                        </li>
                        <li>
                            <span className="step-icon">🏠</span>
                            从主屏幕打开应用，即可全屏显示
                        </li>
                    </ol>
                </div>
                
                <div className="ios-hint-benefits">
                    <h4>添加到主屏幕的好处：</h4>
                    <ul>
                        <li>✓ 隐藏浏览器地址栏和工具栏</li>
                        <li>✓ 真正的 fullscreen 体验</li>
                        <li>✓ 类似原生应用的界面</li>
                        <li>✓ 支持离线使用（PWA）</li>
                        <li>✓ 快速启动，无需打开浏览器</li>
                    </ul>
                </div>
                
                <button className="ios-hint-action" onClick={onClose}>
                    我知道了
                </button>
            </div>
        </div>
    );
};
