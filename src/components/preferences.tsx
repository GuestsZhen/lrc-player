import LINK from "#const/link.json" assert { type: "json" };
import STRINGS from "#const/strings.json" assert { type: "json" };
import { convertTimeToTag, formatText } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { themeColor, ThemeMode } from "../hooks/usePref.js";
import { unregister } from "../utils/sw.unregister.js";
import { appContext, ChangBits } from "./app.context.js";
import enUS from "../languages/en-US.json" assert { type: "json" };
import zhCN from "../languages/zh-CN.json" assert { type: "json" };
import zhTW from "../languages/zh-TW.json" assert { type: "json" };

const numberInputProps = { type: "number", step: 1 } as const;

type OnChange<T> = (event: React.ChangeEvent<T>) => void;

type IUseNumberInput<T = HTMLInputElement> = (
    defaultValue: number,
    onChange: OnChange<T>,
) => typeof numberInputProps & {
    ref: React.RefObject<T>;
    onChange: OnChange<T>;
    defaultValue: number;
};

const useNumberInput: IUseNumberInput = (defaultValue: number, onChange) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const target = ref.current;
        if (target) {
            const onChange = (): void => {
                target.value = defaultValue.toString();
            };

            target.addEventListener("change", onChange);
            return (): void => target.removeEventListener("change", onChange);
        }
    }, [defaultValue]);

    const $onChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            if (ev.target.validity.valid) {
                onChange(ev);
            }
        },
        [onChange],
    );

    return { ...numberInputProps, ref, onChange: $onChange, defaultValue };
};

const langMap: Array<[string, { languageName: string }]> = [
    ['en-US', enUS],
    ['zh-CN', zhCN],
    ['zh-TW', zhTW],
];

export const Preferences: React.FC = () => {
    const { prefState, prefDispatch, lang } = useContext(appContext, ChangBits.lang || ChangBits.prefState);

    const onColorPick = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            prefDispatch({
                type: "themeColor",
                payload: ev.target.value,
            });
        },
        [prefDispatch],
    );

    const userColorInputText = useRef<HTMLInputElement>(null);

    const onUserInput = useCallback(
        (input: EventTarget & HTMLInputElement) => {
            let value = input.value;

            if (!input.validity.valid) {
                input.value = input.defaultValue;
                return;
            }

            if (value.length === 3) {
                const [r, g, b] = value;
                value = r + r + g + g + b + b;
            }
            if (value.length < 6) {
                value = value.padEnd(6, "0");
            }

            prefDispatch({
                type: "themeColor",
                payload: "#" + value,
            });
        },
        [prefDispatch],
    );

    const onUserColorInputBlur = useCallback(
        (ev: React.FocusEvent<HTMLInputElement>) => onUserInput(ev.target),
        [onUserInput],
    );

    const onColorSubmit = useCallback(
        (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();

            const form = ev.target as HTMLFormElement;

            const input = form.elements.namedItem("user-color-input-text") as HTMLInputElement;

            return onUserInput(input);
        },
        [onUserInput],
    );

    useEffect(() => {
        userColorInputText.current!.value = prefState.themeColor.slice(1);
    }, [prefState.themeColor]);

    const onSpaceChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            prefDispatch({
                type: ev.target.name as "spaceStart" & "spaceEnd",
                payload: ev.target.value,
            });
        },
        [prefDispatch],
    );

    const onCacheClear = useCallback(() => {
        void unregister();
        
        // 清理 IndexedDB 中的 MusicPlayerDB
        if ('indexedDB' in window) {
            const deleteRequest = indexedDB.deleteDatabase('MusicPlayerDB');
            deleteRequest.onsuccess = () => {
            };
            deleteRequest.onerror = () => {
                console.error('清除 IndexedDB 失败');
            };
        }
        
        // 清理 localStorage 和 sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // 刷新页面以应用更改
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }, []);

    const updateTime = useMemo(() => {
        const date = new Date(import.meta.env.app.updateTime);
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "short",
            hour12: false,
        };
        return new Intl.DateTimeFormat(prefState.lang, options).format(date);
    }, [prefState.lang]);

    const onLangChanged = useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            prefDispatch({
                type: "lang",
                payload: ev.target.value,
            });
        },
        [prefDispatch],
    );

    const onBuiltInAudioToggle = useCallback(
        () =>
            prefDispatch({
                type: "builtInAudio",
                payload: (prefState) => !prefState.builtInAudio,
            }),
        [prefDispatch],
    );

    const onShowWaveformToggle = useCallback(
        () =>
            prefDispatch({
                type: "showWaveform",
                payload: (prefState) => !prefState.showWaveform,
            }),
        [prefDispatch],
    );

    const onScreenButtonToggle = useCallback(
        () =>
            prefDispatch({
                type: "screenButton",
                payload: (prefState) => !prefState.screenButton,
            }),
        [prefDispatch],
    );

    const onThemeModeChange = useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            prefDispatch({
                type: "themeMode",
                payload: Number.parseInt(ev.target.value, 10) as ThemeMode,
            });
        },
        [prefDispatch],
    );

    const onFixedChanged = useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            prefDispatch({
                type: "fixed",
                payload: Number.parseInt(ev.target.value, 10) as Fixed,
            });
        },
        [prefDispatch],
    );

    const LangOptionList = useMemo(() => {
        return langMap.map(([code, langData]) => {
            return (
                <option key={code} value={code}>
                    {langData.languageName}
                </option>
            );
        });
    }, []);

    const ColorPickerWall = useMemo(() => {
        return Object.values(themeColor).map((color) => {
            const checked = color === prefState.themeColor;
            const classNames = ["color-picker", "ripple"];
            if (checked) {
                classNames.push("checked");
            }
            return (
                <label className={classNames.join(STRINGS.space)} key={color} style={{ backgroundColor: color }}>
                    <input
                        hidden={true}
                        type="radio"
                        name="theme-color"
                        value={color}
                        checked={checked}
                        onChange={onColorPick}
                    />
                </label>
            );
        });
    }, [onColorPick, prefState.themeColor]);

    const currentThemeColorStyle = useMemo(() => {
        return {
            backgroundColor: prefState.themeColor,
        };
    }, [prefState.themeColor]);

    const formatedText = useMemo(() => {
        return formatText("   hello   世界～   ", prefState.spaceStart, prefState.spaceEnd);
    }, [prefState.spaceStart, prefState.spaceEnd]);

    const userColorLabel = useRef<HTMLLabelElement>(null);
    const userColorInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userColorInput.current!.type === "color") {
            userColorLabel.current!.removeAttribute("for");
        }
    }, []);

    return (
        <div className="preferences">
            <ul>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.version}</span>
                        <span className="select-all">{import.meta.env.app.version}</span>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.commitHash}</span>
                        <span className="select-all">{import.meta.env.app.hash}</span>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.updateTime}</span>
                        <span>{updateTime}</span>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.repo}</span>
                        <a className="link" href={LINK.url} target="_blank" rel="noopener noreferrer">
                            Github
                        </a>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.language}</span>
                        <div className="option-select">
                            <select
                                value={prefState.lang}
                                onChange={onLangChanged}
                                aria-label={lang.preferences.language}
                            >
                                {LangOptionList}
                            </select>
                        </div>
                    </section>
                </li>
                <li>
                    <label className="list-item">
                        <span>{lang.preferences.builtInAudio}</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefState.builtInAudio}
                                onChange={onBuiltInAudioToggle}
                                aria-label={lang.preferences.builtInAudio}
                            />
                            <span className="toggle-switch-label" />
                        </label>
                    </label>
                </li>
                <li>
                    <label className="list-item">
                        <span>{lang.preferences.spaceButton}</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefState.screenButton}
                                onChange={onScreenButtonToggle}
                                aria-label={lang.preferences.spaceButton}
                            />
                            <span className="toggle-switch-label" />
                        </label>
                    </label>
                </li>
                <li>
                    <label className="list-item">
                        <span>{lang.preferences.showWaveform}</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefState.showWaveform}
                                onChange={onShowWaveformToggle}
                                aria-label={lang.preferences.showWaveform}
                            />
                            <span className="toggle-switch-label" />
                        </label>
                    </label>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.themeMode.label}</span>
                        <div className="option-select">
                            <select
                                name="theme-mode"
                                value={prefState.themeMode}
                                onChange={onThemeModeChange}
                                aria-label={lang.preferences.themeMode.label}
                            >
                                <option value={ThemeMode.light}>{lang.preferences.themeMode.light}</option>
                                <option value={ThemeMode.dark}>{lang.preferences.themeMode.dark}</option>
                            </select>
                        </div>
                    </section>
                </li>

                <li>
                    <section className="list-item">
                        <span>{lang.preferences.themeColor}</span>
                        <details className="dropdown">
                            <summary>
                                <span className="color-picker ripple hash" style={currentThemeColorStyle}>
                                    {"#"}
                                </span>
                                <span className="current-theme-color">{prefState.themeColor.slice(1)}</span>
                            </summary>
                            <form className="dropdown-body color-wall" onSubmit={onColorSubmit}>
                                {ColorPickerWall}
                                <label
                                    className="color-picker ripple user-color-label hash"
                                    htmlFor="user-color-input-text"
                                    style={currentThemeColorStyle}
                                    ref={userColorLabel}
                                >
                                    {"#"}
                                    <input
                                        type="color"
                                        className="color-picker pseudo-hidden"
                                        value={prefState.themeColor}
                                        onChange={onColorPick}
                                        ref={userColorInput}
                                    />
                                </label>
                                <input
                                    ref={userColorInputText}
                                    id="user-color-input-text"
                                    name="user-color-input-text"
                                    className="user-color-input-text"
                                    type="text"
                                    pattern="[\da-f]{3,6}"
                                    required={true}
                                    autoCapitalize="none"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    defaultValue={prefState.themeColor.slice(1)}
                                    onBlur={onUserColorInputBlur}
                                />
                            </form>
                        </details>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.lrcFormat}</span>
                        <span>
                            <time className="format-example-time">{convertTimeToTag(83.456, prefState.fixed)}</time>
                            <span className="format-example-text">{formatedText}</span>
                        </span>
                    </section>
                </li>
                <li>
                    <section className="list-item">
                        <span>{lang.preferences.fixed}</span>
                        <div className="option-select">
                            <select
                                name="fixed"
                                value={prefState.fixed}
                                onChange={onFixedChanged}
                                aria-label={lang.preferences.lrcFormat}
                            >
                                <option value={0}>0</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>
                    </section>
                </li>
                <li>
                    <label className="list-item">
                        <label htmlFor="space-start">{lang.preferences.leftSpace}</label>
                        <input
                            name="spaceStart"
                            id="space-start"
                            required={true}
                            min={-1}
                            {...useNumberInput(prefState.spaceStart, onSpaceChange)}
                        />
                    </label>
                </li>
                <li>
                    <label className="list-item">
                        <label htmlFor="space-end">{lang.preferences.rightSpace}</label>
                        <input
                            name="spaceEnd"
                            id="space-end"
                            required={true}
                            min={-1}
                            {...useNumberInput(prefState.spaceEnd, onSpaceChange)}
                        />
                    </label>
                </li>
                <li className="ripple" onTransitionEnd={onCacheClear}>
                    <section className="list-item">{lang.preferences.clearCache}</section>
                </li>
            </ul>

            {/* 项目介绍 */}
            <div className="project-intro">
                <h2>{lang.preferences.projectIntro.title}</h2>

                {/* 播放器 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.player.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.player.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 简谱转调工具 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.tune.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.tune.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 歌词编辑器 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.editor.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.editor.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 歌词工具箱 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.utils.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.utils.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 歌词同步器 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.synchronizer.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.synchronizer.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 偏好设置 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.preferences.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.preferences.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* Gist 云同步 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.gist.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.gist.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* ST播放器 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.stPlayer.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.stPlayer.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 技术特性 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.techStack.title}</h3>
                    <ul>
                        {lang.preferences.projectIntro.techStack.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* 如何使用 */}
                <section className="intro-section">
                    <h3>{lang.preferences.projectIntro.usage.title}</h3>
                    <p>{lang.preferences.projectIntro.usage.basicOperation}</p>
                    <p>
                        <a href="https://guestszhen.github.io/lrc-player" target="_blank" rel="noopener noreferrer">
                            {lang.preferences.projectIntro.usage.onlineDemo}
                        </a>
                    </p>
                    
                    <h4>{lang.preferences.projectIntro.usage.scenarios.title}</h4>
                    <ol>
                        {lang.preferences.projectIntro.usage.scenarios.items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ol>
                </section>

                {/* 致谢 */}
                <section className="intro-section credit">
                    <p>
                        {lang.preferences.projectIntro.credit.text}
                        <br />
                        {lang.preferences.projectIntro.credit.repoText}
                        <a href={lang.preferences.projectIntro.credit.repoUrl} target="_blank" rel="noopener noreferrer">
                            {lang.preferences.projectIntro.credit.repoUrl}
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
};
