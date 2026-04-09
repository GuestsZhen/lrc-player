# 🐛 Bug 修复记录

## 修复 #1: 关闭应用时清除歌词文件

### 问题描述
每次关闭浏览器标签页或刷新页面后，之前打开的 LRC 歌词文件仍然保留在 localStorage 中，导致下次打开应用时会自动加载上次的歌词，这可能不是用户期望的行为。

### 根本原因
在 `src/components/content.tsx` 中，应用使用 `beforeunload` 事件保存状态到 localStorage：

```typescript
// 旧代码
window.addEventListener("beforeunload", saveState);
```

`saveState` 函数会将当前歌词保存到 `localStorage.setItem(LSK.lyric, ...)`，但从未在关闭时清除。

### 解决方案

**修改了 3 个文件：**

1. **src/components/content.tsx** (第 402-408 行)
   - 修改 `useLrc` 初始化，不再从 localStorage 读取歌词
   - 每次启动时歌词状态初始化为空
   
   ```typescript
   const [lrcState, lrcDispatch] = useLrc(() => {
       return {
           text: STRINGS.emptyString,  // 不再从 localStorage 加载
           options: trimOptions,
           select: 0,  // 重置选择索引
       };
   });
   ```

2. **src/components/content.tsx** (第 469-487 行)
   - 添加 `clearLrcOnClose()` 函数
   - 在 `beforeunload` 事件中清除歌词数据
   
   ```typescript
   function clearLrcOnClose(): void {
       localStorage.removeItem(LSK.lyric);
       sessionStorage.removeItem(SSK.selectIndex);
   }
   
   window.addEventListener("beforeunload", clearLrcOnClose);
   ```

3. **src/components/lrc-utils.tsx** (第 52-66 行)
   - 移除自动从 localStorage 加载歌词的逻辑
   - 注释掉 `onInputBlur` 自动保存功能
   - 初始化时输入框设置为空

### 修改的文件
- `src/components/content.tsx` (第 402-408 行, 第 469-487 行)
- `src/components/lrc-utils.tsx` (第 52-66 行)

### 影响范围
- ✅ 关闭浏览器标签页时清除歌词
- ✅ 刷新页面时清除歌词
- ✅ 关闭浏览器窗口时清除歌词
- ⚠️ 切换页面（路由）不会清除歌词（这是预期行为）

### 测试步骤
1. 打开应用并加载一个 LRC 歌词文件
2. 确认歌词已显示
3. 关闭浏览器标签页
4. 重新打开应用
5. 验证歌词已被清除，显示为空状态

### 注意事项
- 偏好设置（preferences）仍然会保留，因为它们通常是用户的长期设置
- 只有歌词内容和选择索引会被清除
- 如果用户需要持久化歌词，应该使用“保存到 Gist”功能

---

## 修复 #2: 自动播放时未加载同名 LRC 歌词文件

### 问题描述
在 Player 页面，从左上角打开文件选择多个文件后：
- ✅ 文件显示在列表中
- ✅ 第一首歌曲自动播放
- ❌ **但没有自动加载同名的 LRC 歌词文件**
- ⚠️ 需要双击歌曲名字（重新播放）才能加载歌词

### 根本原因
footer.tsx 中触发的事件名称与 content.tsx 监听的不一致：

```typescript
// footer.tsx (错误)
window.dispatchEvent(new CustomEvent('lrc-file-selected', {
    detail: { file: firstTrack.lrcFile }  // 属性名也是错的
}));

// content.tsx (期望)
window.addEventListener('load-lrc-file', handleLoadLrcFile);
// 期望 detail.lrcFile
```

### 解决方案
修改 footer.tsx 第 471-475 行，将事件名称和属性名改为正确值：

```typescript
// 修改后
if (firstTrack.lrcFile) {
    window.dispatchEvent(new CustomEvent('load-lrc-file', {
        detail: { lrcFile: firstTrack.lrcFile }  // 使用 lrcFile 而不是 file
    }));
}
```

### 修改的文件
- `src/components/footer.tsx` (第 471-475 行)

### 影响范围
- ✅ 从 Header 打开文件时，第一首歌曲自动播放会加载歌词
- ✅ 添加文件到播放列表时，如果有匹配的 LRC 会自动加载
- ✅ 与其他地方的 LRC 加载逻辑保持一致

---

## 修复 #3: LrcUtils 页面未显示当前歌词

### 问题描述
在修复 #1 之后，进入 LrcUtils（歌词工具）页面时：
- ❌ 输入框显示为空
- ❌ 没有显示当前正在编辑的歌词

### 根本原因
之前修改 lrc-utils.tsx 时，将初始化逻辑改为始终设置为空字符串，忽略了传入的 `lrcState` prop：

```typescript
// 错误的代码
useEffect(() => {
    if (inputRef.current) {
        inputRef.current.value = "";  // ❌ 始终为空
    }
}, []);
```

### 解决方案
修改 lrc-utils.tsx 第 32-59 行，使用传入的 `lrcState` 初始化输入框：

```typescript
// 修改后
export const LrcUtils: React.FC<{
    lrcState: LrcState;
    lrcDispatch: React.Dispatch<LrcAction>;
}> = ({ lrcState }) => {  // ✅ 解构获取 lrcState
    // ...
    
    useEffect(() => {
        if (inputRef.current && lrcState) {
            // 将当前的歌词状态转换为文本并显示
            const lyricText = stringify(lrcState, prefState);
            inputRef.current.value = lyricText;  // ✅ 使用当前歌词
        }
    }, [lrcState, prefState]);
```

### 修改的文件
- `src/components/lrc-utils.tsx` (第 32-59 行)

### 影响范围
- ✅ LrcUtils 页面正确显示当前歌词
- ✅ 与 content.tsx 的状态管理保持一致
- ✅ 用户可以在当前歌词基础上进行工具处理

---

**修复日期**: 2026-04-XX  
**文档版本**: 0.4.0

---

## 修复 #4: Tune 页面下拉菜单文字颜色问题

### 问题描述
在 Tune（转调）页面中：
- ❌ "原调"和"目标调性"的下拉菜单文字显示为白色
- ❌ 在某些背景颜色下看不清文字

### 根本原因
CSS 样式中硬编码了 `color: var(--white)`，没有跟随主题变化：

```css
/* editor.css 第 334 行 */
.tune-control-group select {
    color: var(--white);  /* ❌ 固定为浅灰色 #eeeeee */
}
```

### 解决方案
修改 editor.css 第 328-354 行，使用主题的字体颜色变量，并为 `<option>` 元素添加样式：

```css
/* 修改后 */
.tune-control-group select {
    padding: 4px 3px;
    font-size: 1rem;
    border: 2px solid var(--theme-color);
    border-radius: 4px;
    background-color: transparent;
    color: var(--font-color);  /* ✅ 使用主题字体颜色 */
    cursor: pointer;
    transition: all 0.3s ease;
}

/* 下拉选项样式 - 适配深色主题 */
.tune-control-group select option {
    background-color: var(--background-color);  /* ✅ 使用主题背景色 */
    color: var(--font-color);  /* ✅ 使用主题字体颜色 */
    padding: 4px;
}

/* 移除了不必要的亮色模式特殊处理 */
```

### 修改的文件
- `src/components/editor.css` (第 328-347 行)

### 影响范围
- ✅ 下拉菜单文字颜色自动适配主题
- ✅ 深色主题下显示浅色文字
- ✅ 浅色主题下显示深色文字
- ✅ 自定义背景颜色下也能清晰显示

---

**最后更新**: 2026-04-XX  
**文档版本**: 0.5.0
