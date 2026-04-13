/**
 * 渐进式集成示例 - 如何安全地使用新重构的组件
 * 
 * 这个文件展示了如何在不破坏现有代码的情况下，
 * 逐步将新的 Store 和组件集成到项目中。
 */

// ============================================
// 示例 1: 在新功能中使用 usePlayerSettings
// ============================================

import { usePlayerSettings } from '../stores/playerSettings';

export function NewFeatureComponent() {
  // 直接使用 Store，无需传递 props
  const { fontSize, bgColor, setFontSize } = usePlayerSettings();
  
  return (
    <div style={{ fontSize, backgroundColor: bgColor }}>
      <p>这是一个新功能组件</p>
      <button onClick={() => setFontSize(fontSize + 0.1)}>
        增大字体
      </button>
    </div>
  );
}

// ============================================
// 示例 2: 在新页面中使用 FileListPanel
// ============================================

import { FileListPanel } from './file-manager/FileListPanel';
import { useFileManager } from '../stores/fileManager';
import { useContext } from 'react';
import { appContext } from './app.context';

export function NewPageComponent() {
  const { showFileListPanel, setShowFileListPanel } = useFileManager();
  const { lang } = useContext(appContext);
  
  return (
    <div>
      <button onClick={() => setShowFileListPanel(true)}>
        显示文件列表
      </button>
      
      {showFileListPanel && (
        <FileListPanel 
          onClose={() => setShowFileListPanel(false)}
          lang={lang}
        />
      )}
    </div>
  );
}

// ============================================
// 示例 3: 在现有组件中安全地添加新功能
// ============================================

import { useNavigation } from '../stores/navigation';

export function EnhancedHeaderButton() {
  const { togglePlayerSettings, closeAllMenus } = useNavigation();
  
  return (
    <div>
      <button onClick={togglePlayerSettings}>
        打开设置
      </button>
      <button onClick={closeAllMenus}>
        关闭所有菜单
      </button>
    </div>
  );
}

// ============================================
// 示例 4: 创建一个新的独立设置面板
// ============================================

import { PlayerSettingsPanel } from './player-settings/PlayerSettingsPanel';

export function FloatingSettingsPanel() {
  const { showPlayerSettings, isHiding, closePlayerSettings } = useNavigation();
  const { lang } = useContext(appContext);
  
  if (!showPlayerSettings) return null;
  
  return (
    <div className="floating-settings-overlay">
      <PlayerSettingsPanel 
        onClose={closePlayerSettings}
        isHiding={isHiding}
        lang={lang}
      />
    </div>
  );
}

// ============================================
// 集成建议
// ============================================

/**
 * 阶段 1: 在新功能中使用新组件（零风险）
 * ----------------------------------------
 * - 新开发的页面/组件直接使用新的 Store 和组件
 * - 不影响现有代码
 * - 可以立即享受架构优势
 * 
 * 阶段 2: 为现有功能添加增强（低风险）
 * ----------------------------------------
 * - 在现有组件旁边添加新功能按钮
 * - 新功能使用新架构
 * - 旧功能保持不变
 * 
 * 阶段 3: 逐步替换（中风险）
 * ----------------------------------------
 * - 选择一个简单的模块开始替换
 * - 例如：先替换 Player 设置面板
 * - 充分测试后再继续
 * 
 * 阶段 4: 全面迁移（高风险，可选）
 * ----------------------------------------
 * - 完全重写 header.tsx 和 content.tsx
 * - 需要大量测试
 * - 仅在必要时进行
 */

// ============================================
// 最佳实践
// ============================================

/**
 * 1. 使用 useShallow 优化性能
 */
import { useShallow } from 'zustand/react/shallow';

function OptimizedComponent() {
  // 只订阅需要的字段，避免不必要的重渲染
  const { fontSize, setFontSize } = usePlayerSettings(
    useShallow(state => ({
      fontSize: state.fontSize,
      setFontSize: state.setFontSize
    }))
  );
  
  return <button onClick={() => setFontSize(fontSize + 0.1)}>+</button>;
}

/**
 * 2. 在事件处理器中使用 Store
 */
function EventDrivenComponent() {
  const { playFile } = useFileManager();
  
  const handleFileClick = (fileName: string) => {
    // Store 会自动处理所有逻辑
    playFile(fileName);
  };
  
  return <button onClick={() => handleFileClick('song.mp3')}>播放</button>;
}

/**
 * 3. 组合多个 Store
 */
function CombinedStoresComponent() {
  const playerSettings = usePlayerSettings();
  const navigation = useNavigation();
  const fileManager = useFileManager();
  
  return (
    <div>
      <p>当前字体: {playerSettings.fontSize}</p>
      <p>当前播放: {fileManager.currentPlayingFile}</p>
      <button onClick={navigation.closeAllMenus}>关闭菜单</button>
    </div>
  );
}
