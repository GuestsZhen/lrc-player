/**
 * EQ 均衡器弹窗组件
 * 独立的 EQ 调节面板，显示在屏幕底部
 */

import React from 'react';

interface EQBand {
    index: number;
    freq: number;
    level: number;
    minLevel: number;
    maxLevel: number;
}

interface EQModalProps {
    showEQModal: boolean;
    eqBands: EQBand[];
    stVocalRemoval: boolean;
    onClose: () => void;
    onToggleVocalRemoval: () => void;
    onAdjustEQBand: (bandIndex: number, level: number) => void;
}

export const EQModal: React.FC<EQModalProps> = ({
    showEQModal,
    eqBands,
    stVocalRemoval,
    onClose,
    onToggleVocalRemoval,
    onAdjustEQBand
}) => {
    if (!showEQModal) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '130px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                paddingTop: '1px',
                paddingBottom: '2px',
                paddingLeft: '16px',
                paddingRight: '16px',
                width: 'calc(100vw - 32px)',
                maxWidth: '400px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            {/* 标题栏 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px',
                paddingBottom: '1px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                }}>
                    EQ 均衡器
                </h3>
                <div style={{ display: 'flex', gap: '58px', alignItems: 'center' }}>
                    {/* 去人声按钮 */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px'
                    }}>
                        <span style={{ 
                            fontSize: '0.9rem',
                            color: '#ccc',
                            fontWeight: '500'
                        }}>
                            去人声
                        </span>
                        <label className="toggle-switch" style={{ marginBottom: 0 }} title="启用/关闭去人声功能">
                            <input 
                                type="checkbox" 
                                checked={stVocalRemoval}
                                onChange={onToggleVocalRemoval}
                            />
                            <span className="toggle-switch-label"></span>
                        </label>
                    </div>
                    {/* 关闭按钮 */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#999';
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>
            
            {/* EQ 频段调节 */}
            {eqBands.length > 0 ? (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px'
                }}>
                    {eqBands.map(band => (
                        <div key={band.index} style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ 
                                fontSize: '0.85rem', 
                                minWidth: '70px',
                                color: '#ccc',
                                fontWeight: '500'
                            }}>
                                {band.freq >= 1000 ? `${(band.freq / 1000).toFixed(1)}kHz` : `${band.freq}Hz`}
                            </span>
                            <input
                                type="range"
                                min={band.minLevel}
                                max={band.maxLevel}
                                step="0.5"
                                value={band.level}
                                onChange={(e) => {
                                    const newLevel = parseFloat(e.target.value);
                                    onAdjustEQBand(band.index, newLevel);
                                }}
                                style={{
                                    flex: 1,
                                    height: '6px',
                                    WebkitAppearance: 'none',
                                    background: 'linear-gradient(to right, #F44336, #FFC107, #4CAF50)',
                                    borderRadius: '3px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ 
                                fontSize: '0.85rem', 
                                minWidth: '60px',
                                textAlign: 'right',
                                color: band.level < -5 ? '#F44336' : band.level > 5 ? '#4CAF50' : '#4CAF50',
                                fontWeight: 'bold',
                                fontFamily: 'monospace'
                            }}>
                                {band.level > 0 ? '+' : ''}{band.level.toFixed(1)}dB
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ 
                    padding: '32px', 
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '0.95rem'
                }}>
                    <div style={{ marginBottom: '8px' }}>⏳</div>
                    正在加载 EQ 频段...
                </div>
            )}
        </div>
    );
};
