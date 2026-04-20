/**
 * 通用滑块组件
 */
import React from 'react';

interface ISliderProps {
    min: number;
    max: number;
    step?: string | number;
    value: number;
    onInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className: string;
}

export const Slider: React.FC<ISliderProps> = ({ min, max, step, value, onInput, className }) => {
    const total = max - min || 1;
    const percent = (value - min) / total;

    return (
        <div className={`slider ${className}-slider`}>
            <progress value={percent} />
            <input
                type="range"
                className={className}
                aria-label={className}
                min={min}
                max={max}
                step={step}
                value={value}
                onInput={onInput}
            />
        </div>
    );
};
