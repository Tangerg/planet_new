# Radix → Base UI 渐进迁移

把前端 headless 组件库从 Radix 逐步换成 [Base UI](https://base-ui.com)(`@base-ui/react`)。**两套库过渡期并存**,一次迁一个 `ui/components/controls/` 封装,迁完即删对应的 `@radix-ui/*` 包。

为什么可行:所有 Radix 都封装在 `controls/` 后面,消费方只依赖封装的公开 API。只要封装的 props 形状不变,换底层库对上层透明 —— 所以能一个一个来,不必大爆炸。

## 约定(由 Switch pilot 确立)

- **封装公开 API 不变**:消费方零改动才是"渐进"的前提。
- **按子路径导入**利于 tree-shaking:`import { Switch } from "@base-ui/react/switch"`。
- **状态样式属性**:Radix `[data-state="checked"]` → Base UI 语义化属性 `[data-checked]` / `[data-unchecked]` / `[data-disabled]` 等。就近 CSS 里的 `data-state` 选择器要逐一改写。
- **子部件状态从 root 驱动**:拿不准某个 part 是否带状态属性时,用 `.root[data-checked] .part { … }` 而非依赖 part 自身属性(见 Switch thumb)。
- **非 button 的 root**:Base UI 某些 root 不是 `<button>`,固定宽高要补 `inline-block`(否则 inline 元素忽略 w/h)。
- **组合**:Radix `asChild`/`Slot` → Base UI `render` prop;通用 `Button`(Radix `Slot`)→ Base UI 的 `useRender` hook。
- **删包时机**:某组件的**最后一个消费方**迁移后,`yarn remove @radix-ui/react-xxx`(否则 knip 报未用依赖)。
- **分块**:`vite.config.ts` 加了 `vendor-baseui` chunk。
- **每步**:`yarn run check` 全绿 + 实机 smoke,单独 commit,勾掉清单。
- **Motion 退出动画**:Base UI 靠 `element.getAnimations()`(WAAPI)判断关闭时保持挂载多久。Motion 只有 `opacity`/`transform`/`filter`/`clipPath` 走 WAAPI 能被检测到;**`y`/`x`/`scale` 简写是 JS 独立 transform,不被检测 → exit 不可见**。所以 exit 动画要写成 `transform: "translateY(…)"`/`"scale(…)"` 而非简写(Sheet 滑出踩过);或至少让 exit 同时动 `opacity` 撑住挂载(HoverCard 如此)。

## 清单(顺序:低风险 → 高风险)

- [x] **Switch**(pilot)—— `data-state`→`data-checked`,已删 `@radix-ui/react-switch`
- [x] **Toggle** —— `pressed`/`onPressedChange` 同名,按下态本就内联(无 CSS 耦合),已删 `@radix-ui/react-toggle`
- [x] **ToggleGroup** —— value 单串↔数组在封装内适配;items 用 Base UI `Toggle`;5 处 `[data-state="on"]`→`[data-pressed]`(ToggleGroup.css×4 + ViewToggle.css×1),已删 `@radix-ui/react-toggle-group`
- [x] **Tooltip** —— 无 asChild:trigger 走 `render={children}`;结构 Portal→Positioner→Popup;`side`/`sideOffset` 移到 Positioner;Provider 属性 `delayDuration`/`skipDelayDuration`→`delay`/`timeout`(Shell 1 行);已删 `@radix-ui/react-tooltip`
- [x] **HoverCard → PreviewCard** —— 新抽 `controls/HoverCard.tsx` 封装(Base UI PreviewCard + Motion enter/exit,`Portal keepMounted` + `AnimatePresence` + `Popup render={motion.div}`),`TextReveal`/`VolumeControl` 改为消费封装(不再直接用);delay/closeDelay 移到 Trigger;已删 `@radix-ui/react-hover-card`。vite `optimizeDeps.include` 预登记 @base-ui 子路径,消除 re-optimize 抖动
- [x] **Slider** —— Base UI 加 `Control` 层(Root›Control›Track›Indicator+Thumb),`Range`→`Indicator`,`onValueCommit`→`onValueCommitted`,单 thumb 回调是 number→封装归一化回数组;Control 给方向感知的 fill 布局。封装已存,两消费方(PlayerScrubber/VolumeControl)零改动;已删 `@radix-ui/react-slider`
- [x] **Sheet(Dialog)** —— Overlay→Backdrop、Content→Popup;`forceMount`→Portal `keepMounted`;autofocus 抑制 `onOpenAutoFocus/onCloseAutoFocus`→Popup `initialFocus/finalFocus={false}`;Motion 滑入照 keepMounted+AnimatePresence+render;Portal container 保留。封装已存,3 消费方(LoginSheet/CoverFlowSheet/UpNextSheet)零改动;已删 `@radix-ui/react-dialog`
- [x] **Menu(DropdownMenu → Menu)** —— Content→Positioner+Popup;`onSelect`→`Item onClick`(closeOnClick 默认 true);虚拟 span trigger 走 `render` + `nativeButton={false}`;`data-highlighted` 保留(Menu.css 不改);enter-only 动画(关闭即卸载,无 exit);transformOrigin 用 Base UI `var(--transform-origin)`;已删 `@radix-ui/react-dropdown-menu`
- [x] **Button** —— 迁到最后时发现所有 trigger 早已改用 Base UI `render`,`Button.asChild` **零消费方** → 按 YAGNI 直接去掉 asChild,Button 成为**无 headless 库依赖**的纯 `<button>`(未走 useRender);已删 `@radix-ui/react-slot`。

## ✅ 完成

全部 8 个组件迁完,`@radix-ui/*` 从 9 个包清零,`vendor-radix` chunk 已移除。前端 headless 组件库 = Base UI(`@base-ui/react`)。若将来需要 Button-as-`<a>`,用 Base UI `useRender` 复原 asChild 即可。
